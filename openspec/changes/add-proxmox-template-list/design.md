# Design: Proxmox Template List

## Overview

This design implements a command to list Proxmox VM templates by integrating with the Proxmox VE REST API. The implementation follows the project's layered architecture and introduces a reusable configuration layer for managing Proxmox credentials.

## Architecture

### Layer Responsibilities

#### 1. Configuration Layer (`src/config/`)

**Purpose**: Centralized, validated configuration loading for external services.

**Components**:
- `proxmox.config.ts`: Loads and validates Proxmox environment variables
- `schemas/proxmox-config.schema.ts`: Zod schema defining required config structure

**Key Decisions**:
- Use Zod for runtime validation of environment variables
- Fail fast on missing or invalid configuration
- Single source of truth for Proxmox connection parameters
- Config loaded once and reused across requests

**Schema Structure**:
```typescript
ProxmoxConfigSchema = {
  host: string (URL format, must start with https:// or http://),
  apiToken: string (format: user@realm!tokenid=secret)
}
```

**Error Handling**:
- Throws descriptive error if `PROXMOX_HOST` or `PROXMOX_API_TOKEN` missing
- Validates URL format for host
- Validates token format (contains `!` and `=` separators)

#### 2. Repository Layer (`src/repositories/proxmox.repository.ts`)

**Purpose**: Abstract Proxmox REST API calls and handle HTTP communication.

**Key Decisions**:
- Use Node.js native `fetch` (no external HTTP client dependencies)
- Accept self-signed SSL certificates using custom `https.Agent`
- Parse API token into `Authorization` header format: `PVEAPIToken={tokenID}={secret}`
- Filter API response to only include templates (`template: 1`)
- Return Result type for consistent error handling

**API Integration**:
- **Endpoint**: `GET {host}/api2/json/cluster/resources?type=vm`
- **Authentication**: `Authorization: PVEAPIToken={tokenID}={secret}`
- **SSL**: Create custom agent with `rejectUnauthorized: false` for self-signed certs
- **Response**: Array of VM resources, filter by `template === 1`

**Error Scenarios**:
- Network failures (connection refused, timeout)
- Invalid SSL certificates (handled by custom agent)
- HTTP error status codes (4xx, 5xx)
- Invalid JSON response
- API returns unexpected data structure

**Data Transformation**:
```
Proxmox API Response → Filter templates → Map to ProxmoxTemplateDTO → Return Result
```

#### 3. Service Layer (`src/services/proxmox-template.service.ts`)

**Purpose**: Business logic for template listing, including sorting and validation.

**Key Decisions**:
- Receive repository via constructor injection
- Validate repository response using Zod schema
- Sort templates by VMID ascending (business requirement)
- Return Result type with ServiceError on failures

**Responsibilities**:
- Call repository to fetch templates
- Validate response data structure
- Apply sorting logic (by vmid)
- Transform repository errors to service errors with context

#### 4. Command Layer (`src/commands/proxmox/template/list.ts`)

**Purpose**: CLI interface for listing Proxmox templates.

**Key Decisions**:
- Use `cli-table3` for professional table formatting
- Handle empty results with friendly message: "No templates found"
- Convert Result failures to oclif errors with exit code 1
- Format output to match requirements: VMID, Name, Template columns

**Output Format**:
```
┌──────┬─────────────────┬──────────┐
│ VMID │ Name            │ Template │
├──────┼─────────────────┼──────────┤
│ 100  │ ubuntu-22.04    │ Yes      │
│ 101  │ debian-12       │ Yes      │
└──────┴─────────────────┴──────────┘
```

#### 5. Factory Layer (`src/factories/proxmox-template.factory.ts`)

**Purpose**: Wire dependencies and create service instances.

**Key Decisions**:
- Load config once per factory call
- Create repository with config
- Inject repository into service
- Return fully configured service ready for use

**Dependency Graph**:
```
ProxmoxConfig → ProxmoxRepository → ProxmoxTemplateService
```

## Data Flow

```
User executes: homelab proxmox template list
         ↓
Command Layer (list.ts)
  - Parse args/flags
  - Get service from factory
         ↓
Factory (proxmox-template.factory.ts)
  - Load config from environment
  - Create repository with config
  - Create service with repository
         ↓
Service Layer (proxmox-template.service.ts)
  - Call repository.listTemplates()
  - Validate response with Zod
  - Sort by vmid ascending
  - Return Result<ProxmoxTemplateDTO[], ServiceError>
         ↓
Repository Layer (proxmox.repository.ts)
  - Build API URL with query params
  - Parse API token for Authorization header
  - Create fetch with custom agent (self-signed cert support)
  - Call GET {host}/api2/json/cluster/resources?type=vm
  - Filter response where template === 1
  - Map to ProxmoxTemplateDTO
  - Return Result<ProxmoxTemplateDTO[], RepositoryError>
         ↓
Proxmox API
  - Authenticate via API token
  - Return cluster resources
         ↓
Response flows back through layers
         ↓
Command Layer
  - Format as table using cli-table3
  - Output to console
  - Or display error message and exit(1)
```

## Domain Model

### ProxmoxTemplateDTO

```typescript
{
  vmid: number,        // Virtual Machine ID (unique identifier)
  name: string,        // Template name
  template: number     // Template status (1 = is template)
}
```

**Validation Rules** (Zod Schema):
- `vmid`: Must be positive integer
- `name`: Must be non-empty string
- `template`: Must be 1 (we filter for templates only)

## Configuration

### Environment Variables

| Variable | Format | Example | Required |
|----------|--------|---------|----------|
| `PROXMOX_HOST` | URL (https:// or http://) | `https://proxmox.home.sflab.io:8006` | Yes |
| `PROXMOX_API_TOKEN` | `user@realm!tokenid=secret` | `root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce` | Yes |

### API Token Parsing

Token format: `user@realm!tokenid=secret`
- Split on `!` → `[user@realm, tokenid=secret]`
- Authorization header: `PVEAPIToken=tokenid=secret`

Example:
```
Input: root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce
Output: PVEAPIToken=homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce
```

## Error Handling

### Error Types by Layer

**Configuration Errors**:
- Missing `PROXMOX_HOST` → ConfigError: "PROXMOX_HOST environment variable is required"
- Missing `PROXMOX_API_TOKEN` → ConfigError: "PROXMOX_API_TOKEN environment variable is required"
- Invalid URL format → ConfigError: "PROXMOX_HOST must be a valid URL"
- Invalid token format → ConfigError: "PROXMOX_API_TOKEN must be in format user@realm!tokenid=secret"

**Repository Errors**:
- Network failure → RepositoryError: "Failed to connect to Proxmox API"
- HTTP 401/403 → RepositoryError: "Authentication failed - check API token"
- HTTP 404 → RepositoryError: "Proxmox API endpoint not found"
- HTTP 5xx → RepositoryError: "Proxmox server error"
- Invalid JSON → RepositoryError: "Invalid response from Proxmox API"
- Unexpected response structure → RepositoryError: "Unexpected API response format"

**Service Errors**:
- Repository failure → ServiceError: "Failed to retrieve templates from Proxmox"
- Validation failure → ServiceError: "Template data validation failed"

**Command Errors**:
- Service failure → oclif Error with exit code 1

### Result Pattern Flow

All layers use Result pattern:
```typescript
Success: { success: true, data: T }
Failure: { success: false, error: E }
```

Commands check `result.success` and either:
- Format and display data
- Convert error to user-friendly message and exit(1)

## Testing Strategy

### Unit Tests - Configuration (`test/config/proxmox.config.test.ts`)

Test scenarios:
- Load valid config from environment
- Throw error on missing PROXMOX_HOST
- Throw error on missing PROXMOX_API_TOKEN
- Validate URL format
- Validate token format

### Unit Tests - Repository (`test/repositories/proxmox.repository.test.ts`)

Test scenarios:
- Successfully fetch and parse templates
- Handle network errors
- Handle HTTP error status codes
- Handle invalid JSON responses
- Handle unexpected response structure
- Correctly parse API token for Authorization header
- Filter only templates (template === 1)

Mock Strategy:
- Mock global `fetch` function
- Return mock Proxmox API responses
- Simulate error conditions

### Unit Tests - Service (`test/services/proxmox-template.service.test.ts`)

Test scenarios:
- Successfully list templates from repository
- Sort templates by vmid ascending
- Handle repository errors
- Handle validation errors
- Return correct Result types

Mock Strategy:
- Mock repository implementation
- Return predefined Result success/failure

### Integration Tests - Command (`test/commands/proxmox/template/list.test.ts`)

Test scenarios:
- Display templates in table format
- Handle empty template list
- Handle configuration errors
- Handle repository errors
- Verify sorting (ascending by vmid)
- Verify exit code on errors

Mock Strategy:
- Mock environment variables
- Mock repository responses via factory

## Dependencies

### New Runtime Dependencies

- **cli-table3** (`^0.6.5`): Table formatting
  - Rationale: Professional output formatting with borders, alignment, colors
  - Alternatives considered: Manual formatting (insufficient), cli-table (unmaintained)

### New Dev Dependencies

- **@types/cli-table3**: TypeScript types for cli-table3

### Built-in Node.js APIs

- **fetch**: HTTP client (Node.js 18+ native)
- **https.Agent**: SSL configuration for self-signed certificates
- **process.env**: Environment variable access

## Future Considerations

### Extensibility

This design lays groundwork for:
1. **Additional Proxmox commands**: The repository can be extended with methods for VM operations, storage, nodes, etc.
2. **Configuration management**: The config layer can be extended for other services (Docker, Kubernetes, etc.)
3. **Multiple Proxmox clusters**: Config could support multiple named Proxmox connections
4. **Output formats**: Command could support `--json` flag for machine-readable output

### Performance

- Config loaded once per command execution (acceptable for CLI)
- Single API call per command (no pagination needed for templates)
- No caching (templates change infrequently, real-time data preferred)

### Security

- API token stored in environment (not in code or config files)
- Self-signed cert support for local/homelab use (appropriate security tradeoff)
- HTTPS enforced by config validation (can allow HTTP for development)
- No credentials logged or exposed in error messages

## Open Questions

None - design is complete and ready for implementation.
