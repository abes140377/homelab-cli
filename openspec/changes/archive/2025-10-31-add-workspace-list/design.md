# Workspace List - Technical Design

## Context

This is the first feature implementation that establishes the full layered architecture pattern documented in `openspec/project.md`. The workspace listing feature serves as a reference implementation for all future features, demonstrating:
- Clean separation between Command, Service, and Repository layers
- Result pattern for type-safe error handling
- Zod-based validation and type inference
- Constructor-based dependency injection via Factory pattern
- Mock repository for development without external dependencies

The existing codebase contains only basic oclif example commands (`hello`). This change introduces the architectural foundation that will be reused for all subsequent features.

## Goals / Non-Goals

**Goals:**
- Establish layered architecture pattern (Command → Service → Repository)
- Demonstrate Result pattern and Zod validation in practice
- Create reusable patterns for error handling and dependency injection
- Provide mock data implementation for database-free development
- Implement comprehensive test coverage at all layers
- Make the codebase ready for future workspace operations (create, update, delete)

**Non-Goals:**
- Real database integration (use mock repository)
- Authentication/authorization (future enhancement)
- Workspace filtering or sorting (keep initial implementation simple)
- JSON output format (focus on human-readable table format)
- Workspace CRUD operations beyond listing (future changes)

## Decisions

### Decision 1: Use In-Memory Mock Repository

**What:** Implement workspace repository with hardcoded mock data instead of database integration.

**Why:**
- Enables rapid development without database setup
- Simplifies testing and local development
- Maintains clean repository interface for future database swap
- User explicitly requested mock data in repository

**Alternatives considered:**
- SQLite database: Rejected because user wants to avoid database initially
- File-based storage: Rejected as more complex than needed for initial version
- API integration: No external API available yet

**Migration path:** The repository interface design allows swapping mock implementation with real database/API implementation without changing service or command layers.

### Decision 2: Repository Pattern with Interfaces

**What:** Define `IWorkspaceRepository` interface and implement `WorkspaceRepository` class.

**Why:**
- Enables dependency inversion (service depends on interface, not implementation)
- Allows easy mocking in service tests
- Makes future implementation swapping trivial
- Follows project conventions in `openspec/project.md`

**Implementation:**
```typescript
// src/repositories/interfaces/workspace.repository.interface.ts
export interface IWorkspaceRepository {
  findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>>;
}

// src/repositories/workspace.repository.ts
export class WorkspaceRepository implements IWorkspaceRepository {
  private readonly mockData: WorkspaceDTO[];
  // ... implementation with mock data
}
```

### Decision 3: Result Pattern for Error Flow

**What:** Use `Result<T, E>` return type for service and repository methods instead of throwing exceptions.

**Why:**
- Makes error handling explicit and type-safe
- Forces callers to handle both success and failure cases
- Eliminates unexpected exceptions bubbling up
- Aligns with functional programming best practices
- Required by project architecture (see `openspec/project.md:84-89`)

**Type structure:**
```typescript
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### Decision 4: Zod for Schema Validation

**What:** Define workspace schema using Zod and infer TypeScript types from it.

**Why:**
- Single source of truth for data structure
- Runtime validation ensures data integrity
- Automatic TypeScript type inference
- Required by project architecture (see `openspec/project.md:91-96`)

**Implementation:**
```typescript
// src/models/schemas/workspace.schema.ts
export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// src/models/workspace.dto.ts
export type WorkspaceDTO = z.infer<typeof WorkspaceSchema>;
```

### Decision 5: Factory Pattern for Dependency Composition

**What:** Create `WorkspaceFactory` to wire dependencies and provide service instances to commands.

**Why:**
- Centralizes dependency configuration
- Commands don't need to know how to construct services
- Simplifies testing (can provide factory with mocks)
- Keeps command layer thin and focused on CLI concerns
- Required by project architecture (see `openspec/project.md:75-80`)

**Usage in command:**
```typescript
async run(): Promise<void> {
  const service = WorkspaceFactory.createWorkspaceService();
  const result = await service.listWorkspaces();
  // handle result...
}
```

### Decision 6: Table Format for Output

**What:** Display workspaces in a formatted table with columns for id, name, createdAt, updatedAt.

**Why:**
- Human-readable for CLI users
- Consistent with typical CLI tool patterns
- Simple to implement with `this.log()`
- No additional dependencies needed

**Future enhancement:** Add `--json` flag for machine-readable output (not in this change).

## Directory Structure

```
src/
├── commands/
│   └── workspace/
│       └── list.ts                    # CLI layer - thin orchestration
├── services/
│   └── workspace.service.ts           # Business logic
├── repositories/
│   ├── interfaces/
│   │   └── workspace.repository.interface.ts  # Repository contract
│   └── workspace.repository.ts        # Mock data implementation
├── models/
│   ├── schemas/
│   │   └── workspace.schema.ts        # Zod schemas
│   └── workspace.dto.ts               # Type definitions
├── factories/
│   └── workspace.factory.ts           # Dependency wiring
├── errors/
│   ├── base.error.ts                  # Base error class (if not exists)
│   ├── service.error.ts               # Service-layer errors
│   └── repository.error.ts            # Repository-layer errors
└── utils/
    └── result.ts                      # Result type definition (if not exists)

test/
├── commands/
│   └── workspace/
│       └── list.test.ts               # Integration tests
├── services/
│   └── workspace.service.test.ts      # Service unit tests
└── repositories/
    └── workspace.repository.test.ts   # Repository unit tests
```

## Data Flow

```
User: homelab workspace list
    ↓
WorkspaceListCommand.run()
    ├─ Parse args/flags (none for now)
    ├─ WorkspaceFactory.createWorkspaceService()
    │   └─ new WorkspaceService(new WorkspaceRepository())
    ├─ service.listWorkspaces()
    │   └─ repository.findAll()
    │       └─ return Result<WorkspaceDTO[], RepositoryError>
    │           - Success: { success: true, data: [...mockData] }
    │           - Failure: { success: false, error: RepositoryError }
    └─ Handle Result:
        - Success: Format table and this.log()
        - Failure: Convert to oclif error and throw
```

## Mock Data Structure

The repository will maintain the following mock data:

```typescript
private readonly mockData: WorkspaceDTO[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'production',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'staging',
    createdAt: new Date('2024-01-20T14:30:00Z'),
    updatedAt: new Date('2024-02-01T09:15:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'development',
    createdAt: new Date('2024-02-01T08:00:00Z'),
    updatedAt: new Date('2024-02-10T16:45:00Z'),
  },
];
```

## Error Handling Strategy

### Repository Layer Errors
- `RepositoryError`: Base error for data access issues
- In mock implementation, errors are unlikely but infrastructure is in place
- Future real implementations will handle network, database, or filesystem errors

### Service Layer Errors
- `ServiceError`: Wraps repository errors with business context
- Validates data using Zod schemas
- Returns typed Result objects

### Command Layer Error Conversion
```typescript
if (!result.success) {
  this.error(`Failed to list workspaces: ${result.error.message}`, {
    exit: 1,
  });
}
```

## Testing Strategy

### Unit Tests - WorkspaceRepository (test/repositories/workspace.repository.test.ts)
- Verify mock data structure matches WorkspaceSchema
- Test `findAll()` returns success Result with array of 3 workspaces
- Verify data consistency across multiple calls
- Validate all required fields are present

### Unit Tests - WorkspaceService (test/services/workspace.service.test.ts)
- Mock the repository interface
- Test success path: repository returns success → service returns success
- Test failure path: repository returns error → service returns wrapped error
- Verify Zod validation is applied to results
- Test with empty workspace array

### Integration Tests - WorkspaceListCommand (test/commands/workspace/list.test.ts)
- Use `runCommand('workspace list')` from `@oclif/test`
- Verify output contains workspace names
- Verify output formatting (table structure)
- Test error scenarios (mock factory to return failing service)
- Verify exit codes

## Risks / Trade-offs

### Risk: Mock Data Limitations
**Risk:** Mock data may not reflect real-world edge cases (malformed data, partial data, etc.).

**Mitigation:**
- Repository interface design supports real implementation swap
- Zod validation will catch schema violations when real data is introduced
- Mock data serves as test fixtures and documentation

### Risk: Over-Engineering for Simple Feature
**Risk:** Full layered architecture might seem excessive for listing 3 hardcoded workspaces.

**Mitigation:**
- This is the foundation for future workspace CRUD operations
- Architecture demonstrates patterns for all future features
- Mock repository will be replaced with real implementation
- Testability and maintainability benefits outweigh initial overhead

### Trade-off: Table Format Only
**Trade-off:** No JSON output initially means less scriptability.

**Future enhancement:** Add `--json` flag in a future change without breaking existing behavior.

## Migration Plan

### Phase 1: Mock Implementation (This Change)
- Implement all layers with mock repository
- Establish testing patterns
- Validate architecture works end-to-end

### Phase 2: Real Data Source (Future Change)
- Create new repository implementation (e.g., `ApiWorkspaceRepository`, `DbWorkspaceRepository`)
- Update factory to instantiate real repository
- No changes needed to service or command layers
- Update tests to use integration tests with real data source

### Phase 3: Enhanced Features (Future Changes)
- Add workspace CRUD operations (create, update, delete)
- Add filtering, sorting, pagination
- Add `--json` output flag
- Add workspace selection/context switching

## Open Questions

None. The requirements are clear and the architecture is well-defined in `openspec/project.md`.
