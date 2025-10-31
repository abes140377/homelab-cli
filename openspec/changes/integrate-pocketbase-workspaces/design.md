# PocketBase Workspace Integration - Technical Design

## Context

The homelab-cli currently has a workspace list command (`homelab workspace list`) that uses mock in-memory data. PocketBase is already set up with a 'workspaces' collection that contains real workspace data. This change integrates the PocketBase JavaScript SDK to fetch workspace data from the real backend.

The existing workspace implementation established the layered architecture pattern. This change extends that pattern by adding a new repository implementation that communicates with PocketBase instead of returning mock data.

## Goals / Non-Goals

**Goals:**

- Install and integrate PocketBase JavaScript SDK
- Create configuration management for PocketBase connection settings
- Implement `PocketBaseWorkspaceRepository` following `IWorkspaceRepository` interface
- Add new command `homelab workspace list-pocketbase` that uses PocketBase repository
- Handle PocketBase authentication (optional admin auth for protected collections)
- Maintain existing architecture patterns (Result type, Zod validation, dependency injection)
- Provide clear error messages for connection and authentication failures
- Add comprehensive test coverage

**Non-Goals:**

- Modify existing `homelab workspace list` command (keep mock implementation)
- Implement workspace CRUD operations (create, update, delete) - future enhancement
- Add custom auth store for persistent authentication - use default for now
- Support multiple PocketBase instances - single instance configuration only
- Add filtering, sorting, or pagination - fetch all workspaces initially

## Decisions

### Decision 1: Add Separate Command Instead of Replacing Mock Command

**What:** Create new `homelab workspace list-pocketbase` command instead of replacing `homelab workspace list`.

**Why:**

- Allows users to compare mock vs. real data during development
- Keeps mock implementation for testing and demos
- Non-breaking change for existing users
- Clear command name indicates data source

**Alternatives considered:**

- Replace mock command: Rejected to avoid breaking changes and allow side-by-side comparison
- Add `--source` flag: Rejected to keep command interface simple initially

**Future migration:** In a future change, we can add a `--source` flag to `workspace list` and deprecate `list-pocketbase`.

### Decision 2: PocketBase SDK Installation

**What:** Install `pocketbase` npm package via pnpm.

**Why:**

- Official PocketBase JavaScript/TypeScript SDK
- Well-maintained with TypeScript types included
- Supports both browser and Node.js environments
- Simple API for collections: `pb.collection('workspaces').getFullList()`

**Installation:**

```bash
pnpm add pocketbase
```

### Decision 3: Configuration with Environment Variables

**What:** Use environment variables for PocketBase configuration, validated with Zod schema.

**Required environment variables:**

- `POCKETBASE_URL`: Full URL to PocketBase instance (e.g., 'http://127.0.0.1:8090')

**Optional environment variables:**

- `POCKETBASE_ADMIN_EMAIL`: Admin email for authentication
- `POCKETBASE_ADMIN_PASSWORD`: Admin password for authentication

**Why:**

- Consistent with existing Proxmox configuration pattern
- Environment variables are standard for CLI tools
- Zod validation ensures configuration correctness before API calls
- Optional auth allows both public and protected collections

**Configuration structure:**

```typescript
// src/config/pocketbase.config.ts
export type PocketBaseConfig = z.infer<typeof PocketBaseConfigSchema>

export function loadPocketBaseConfig(): PocketBaseConfig {
  // Load and validate environment variables
  // Throw descriptive errors for missing/invalid config
}
```

### Decision 4: Repository Implementation Pattern

**What:** Implement `PocketBaseWorkspaceRepository` that satisfies `IWorkspaceRepository` interface.

**Why:**

- Follows existing repository pattern (same interface as mock repository)
- Enables dependency inversion and testability
- Service layer remains unchanged (uses same interface)
- Easy to swap implementations via factory

**Implementation approach:**

```typescript
export class PocketBaseWorkspaceRepository implements IWorkspaceRepository {
  private client: PocketBase

  constructor(config: PocketBaseConfig) {
    this.client = new PocketBase(config.url)
    // Optional: authenticate if credentials provided
  }

  async findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>> {
    try {
      const records = await this.client.collection('workspaces').getFullList()
      // Validate with Zod, map to WorkspaceDTO
      return success(workspaces)
    } catch (error) {
      return failure(new RepositoryError('Failed to fetch workspaces from PocketBase', error))
    }
  }
}
```

### Decision 5: Use getFullList() for Fetching

**What:** Use `pb.collection('workspaces').getFullList()` to fetch all workspace records.

**Why:**

- Simple API - fetches all records in batches automatically
- Default 200 items per batch (configurable via `batch` param if needed)
- No pagination complexity for initial implementation
- Suitable for reasonable workspace counts (<1000)

**Alternatives considered:**

- `getList(page, perPage)`: Rejected as it requires pagination logic
- `getFirstListItem(filter)`: Not suitable for fetching all records

**Future enhancement:** Add pagination support if workspace count grows significantly.

### Decision 6: PocketBase Record Mapping

**What:** Map PocketBase records to `WorkspaceDTO` using existing Zod schema.

**PocketBase record structure:**

```typescript
{
  id: string,           // PocketBase auto-generates UUID
  name: string,         // workspace name
  created: string,      // ISO 8601 timestamp
  updated: string,      // ISO 8601 timestamp
  // ... potentially other fields
}
```

**Mapping strategy:**

- Extract relevant fields from PocketBase record
- Map `created` → `createdAt` (convert string to Date)
- Map `updated` → `updatedAt` (convert string to Date)
- Validate with `WorkspaceSchema` to ensure compatibility
- Return `WorkspaceDTO` objects

**Why:**

- PocketBase uses `created`/`updated` naming convention
- Our domain model uses `createdAt`/`updatedAt` for clarity
- Zod validation ensures data integrity regardless of source

### Decision 7: Error Handling Strategy

**What:** Comprehensive error handling for PocketBase API errors.

**Error scenarios:**

1. **Connection errors**: Network failures, invalid URL, PocketBase down
2. **Authentication errors**: Invalid credentials, expired auth
3. **Collection errors**: Collection doesn't exist, permission denied
4. **Data validation errors**: PocketBase returns unexpected data format

**Handling approach:**

```typescript
try {
  // Authenticate if credentials provided
  if (config.email && config.password) {
    await this.client.admins.authWithPassword(config.email, config.password)
  }

  const records = await this.client.collection('workspaces').getFullList()

  // Validate and map records
  const workspaces = records.map((record) => {
    const validated = WorkspaceSchema.parse({
      id: record.id,
      name: record.name,
      createdAt: new Date(record.created),
      updatedAt: new Date(record.updated),
    })
    return validated
  })

  return success(workspaces)
} catch (error) {
  if (error instanceof ClientResponseError) {
    // PocketBase-specific error
    return failure(new RepositoryError(`PocketBase API error (${error.status}): ${error.message}`, error))
  }
  // Generic error
  return failure(new RepositoryError('Failed to fetch workspaces', error))
}
```

**User-friendly error messages:**

- "Cannot connect to PocketBase at {url}"
- "Authentication failed: Invalid credentials"
- "Collection 'workspaces' not found or permission denied"
- "Invalid workspace data received from PocketBase"

### Decision 8: Authentication Strategy

**What:** Support optional admin authentication for protected collections.

**Why:**

- Some collections may require authentication
- Admin auth is simplest for CLI tools
- User auth would require interactive login flow (future enhancement)
- If no credentials provided, attempt unauthenticated access

**Implementation:**

```typescript
// In repository constructor or findAll()
if (config.adminEmail && config.adminPassword) {
  await this.client.admins.authWithPassword(config.adminEmail, config.adminPassword)
}
```

**Future enhancement:** Support user auth with token storage for persistent sessions.

### Decision 9: Factory Pattern for PocketBase Repository

**What:** Create `PocketBaseWorkspaceFactory` to wire PocketBase repository with service.

**Why:**

- Centralizes configuration loading and repository initialization
- Commands don't need to know about configuration details
- Consistent with existing `WorkspaceFactory` pattern

**Implementation:**

```typescript
export class PocketBaseWorkspaceFactory {
  static createWorkspaceService(): WorkspaceService {
    const config = loadPocketBaseConfig()
    const repository = new PocketBaseWorkspaceRepository(config)
    return new WorkspaceService(repository)
  }
}
```

## Directory Structure

```
src/
├── config/
│   ├── schemas/
│   │   └── pocketbase-config.schema.ts    # Zod schema for PocketBase config
│   └── pocketbase.config.ts               # Config loader
├── repositories/
│   └── pocketbase-workspace.repository.ts # PocketBase implementation
├── factories/
│   └── pocketbase-workspace.factory.ts    # Factory for PocketBase service
├── commands/
│   └── workspace/
│       └── list-pocketbase.ts             # New command
└── models/                                 # Reuse existing schemas/DTOs
    ├── schemas/
    │   └── workspace.schema.ts            # (existing)
    └── workspace.dto.ts                   # (existing)

test/
├── config/
│   └── pocketbase.config.test.ts          # Config validation tests
├── repositories/
│   └── pocketbase-workspace.repository.test.ts  # Repository unit tests
├── integration/
│   └── pocketbase-workspace.integration.test.ts # Integration tests (optional)
└── commands/
    └── workspace/
        └── list-pocketbase.test.ts        # Command tests
```

## Data Flow

```
User: homelab workspace list-pocketbase
    ↓
PocketBaseWorkspaceListCommand.run()
    ├─ Parse args/flags (none initially)
    ├─ Load PocketBase config from environment
    ├─ PocketBaseWorkspaceFactory.createWorkspaceService()
    │   └─ new WorkspaceService(new PocketBaseWorkspaceRepository(config))
    ├─ service.listWorkspaces()
    │   └─ repository.findAll()
    │       ├─ Initialize PocketBase client with URL
    │       ├─ Authenticate if credentials provided
    │       ├─ Fetch: pb.collection('workspaces').getFullList()
    │       ├─ Map PocketBase records to WorkspaceDTO
    │       ├─ Validate with Zod WorkspaceSchema
    │       └─ Return Result<WorkspaceDTO[], RepositoryError>
    └─ Handle Result:
        - Success: Format table and this.log()
        - Failure: Convert to oclif error with helpful message
```

## PocketBase Configuration Schema

```typescript
// src/config/schemas/pocketbase-config.schema.ts
import {z} from 'zod'

export const PocketBaseConfigSchema = z.object({
  url: z.string().url('POCKETBASE_URL must be a valid URL'),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(1).optional(),
})
```

## Testing Strategy

### Unit Tests - PocketBaseConfig (test/config/pocketbase.config.test.ts)

- Test successful config load with valid environment variables
- Test missing POCKETBASE_URL throws descriptive error
- Test invalid URL format fails validation
- Test optional authentication fields (present and absent)

### Unit Tests - PocketBaseWorkspaceRepository (test/repositories/pocketbase-workspace.repository.test.ts)

- Mock PocketBase client using test doubles
- Test success path: getFullList returns records → repository returns WorkspaceDTO[]
- Test authentication called when credentials provided
- Test authentication not called when credentials absent
- Test connection error handling
- Test authentication error handling
- Test invalid data from PocketBase (Zod validation fails)
- Test empty collection returns empty array

### Integration Tests (test/integration/pocketbase-workspace.integration.test.ts)

- **Optional:** Requires real or mock PocketBase instance
- Test actual API calls to PocketBase
- Test with real 'workspaces' collection
- Skip if POCKETBASE_URL not set (conditional test)

### Command Tests (test/commands/workspace/list-pocketbase.test.ts)

- Mock PocketBaseWorkspaceFactory to return service with mock repository
- Test successful execution: output contains workspace names
- Test output formatting matches existing table format
- Test error scenarios (connection failure, auth failure)
- Test with empty workspace collection

## Risks / Trade-offs

### Risk: PocketBase Instance Availability

**Risk:** Command fails if PocketBase instance is down or unreachable.

**Mitigation:**

- Clear error messages indicating connection failure
- Suggest checking POCKETBASE_URL and instance status
- Keep mock command available for offline development

### Risk: Schema Mismatch

**Risk:** PocketBase collection schema doesn't match expected WorkspaceDTO structure.

**Mitigation:**

- Zod validation catches schema mismatches immediately
- Repository maps PocketBase fields to domain model fields
- Error messages indicate which fields are missing or invalid
- Document expected PocketBase collection schema

### Risk: Authentication Complexity

**Risk:** Admin authentication may fail or expire during long-running sessions.

**Mitigation:**

- Admin tokens typically have long expiration (weeks)
- Repository authenticates on each command invocation (stateless)
- Clear error messages for authentication failures
- Future enhancement: Implement auth token caching/refresh

### Trade-off: New Command vs. Replacing Mock

**Trade-off:** Adding a new command creates multiple commands for same functionality.

**Rationale:**

- Non-breaking for existing users
- Allows side-by-side comparison during development
- Clear naming indicates data source
- Future: Consolidate with `--source` flag and deprecate separate commands

### Trade-off: No Pagination Initially

**Trade-off:** `getFullList()` fetches all records, which may be inefficient for large collections.

**Mitigation:**

- Suitable for typical workspace counts (<100-200)
- `getFullList()` automatically batches requests (200 per batch)
- Future enhancement: Add pagination if collection grows significantly

## Expected PocketBase Collection Schema

The PocketBase 'workspaces' collection should have the following schema:

```
Collection: workspaces

Fields:
- id (text, auto-generated UUID)
- name (text, required)
- created (date, auto-generated)
- updated (date, auto-generated)

Rules:
- List: Allow for authenticated users or public (depends on setup)
- View: Allow for authenticated users or public
```

## Environment Setup

No setup required for environment variables because they are already provided by mise from .creds.env.yaml

The following environment are available for configuring PocketBase connection:

```bash
# Required
POCKETBASE_URL=http://127.0.0.1:8090

# Optional (for protected collections)
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

## Open Questions

### Q1: Should authentication be required or optional?

**Answer:** Make authentication optional. Attempt unauthenticated access first. Only require credentials if collection is protected.

### Q2: Should we support user auth in addition to admin auth?

**Answer:** Not in this change. Admin auth is sufficient for CLI tools. User auth requires interactive login flow and token persistence - future enhancement.

### Q3: Should we validate that PocketBase collection exists before fetching?

**Answer:** No pre-validation needed. Let the `getFullList()` call fail naturally and handle the error. Attempting to fetch is the simplest way to detect collection existence.

### Q4: Should we cache the PocketBase client instance?

**Answer:** Not in this change. Keep repository stateless - create client on each call. Caching can be added later if performance becomes an issue.
