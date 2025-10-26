# Implementation Tasks: Proxmox Template List

## Prerequisites

- [x] Install cli-table3 dependency: `pnpm add cli-table3`
- [x] Install @types/cli-table3 dev dependency: `pnpm add -D @types/cli-table3`

## Phase 1: Configuration Layer

- [x] Create `src/config/schemas/proxmox-config.schema.ts` with Zod schema for PROXMOX_HOST and PROXMOX_API_TOKEN
- [x] Create `src/config/proxmox.config.ts` to load and validate environment variables
- [x] Write unit tests in `test/config/proxmox.config.test.ts`
  - Test valid configuration loading
  - Test missing PROXMOX_HOST error
  - Test missing PROXMOX_API_TOKEN error
  - Test invalid URL format error
  - Test invalid token format error
- [x] Run tests: `pnpm test`

## Phase 2: Domain Models

- [x] Create `src/models/schemas/proxmox-template.schema.ts` with Zod schema for ProxmoxTemplate
  - Define vmid (positive integer)
  - Define name (non-empty string)
  - Define template (literal 1)
- [x] Create `src/models/proxmox-template.dto.ts` with type inference from schema
- [x] Verify types compile: `pnpm run build`

## Phase 3: Repository Layer

- [x] Create `src/repositories/interfaces/proxmox.repository.interface.ts` with IProxmoxRepository interface
  - Define `listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>>`
- [x] Create `src/repositories/proxmox.repository.ts` implementing IProxmoxRepository
  - Implement constructor accepting ProxmoxConfig
  - Parse API token to extract tokenID and secret (split on `!`)
  - Implement listTemplates() method:
    - Build API URL: `{host}/api2/json/cluster/resources?type=vm`
    - Create Authorization header: `PVEAPIToken={tokenID}={secret}`
    - Create custom HTTPS agent with `rejectUnauthorized: false`
    - Call fetch with agent
    - Handle HTTP errors (4xx, 5xx)
    - Parse JSON response
    - Filter resources where `template === 1`
    - Map to ProxmoxTemplateDTO
    - Return Result type
- [x] Write unit tests in `test/repositories/proxmox.repository.test.ts`
  - Mock global fetch
  - Test successful template fetching
  - Test API token parsing
  - Test template filtering (template === 1)
  - Test network errors
  - Test HTTP 401/403 errors
  - Test HTTP 5xx errors
  - Test invalid JSON response
  - Test unexpected response structure
  - Verify HTTPS agent configuration
- [x] Run tests: `pnpm test`

## Phase 4: Service Layer

- [x] Create `src/services/proxmox-template.service.ts` with ProxmoxTemplateService class
  - Implement constructor accepting IProxmoxRepository
  - Implement listTemplates() method:
    - Call repository.listTemplates()
    - Handle repository errors (wrap in ServiceError)
    - Validate response with Zod schema
    - Sort by vmid ascending
    - Return Result<ProxmoxTemplateDTO[], ServiceError>
- [x] Write unit tests in `test/services/proxmox-template.service.test.ts`
  - Create mock repository
  - Test successful template listing
  - Test sorting by vmid ascending
  - Test repository error handling
  - Test validation error handling
  - Verify Result type returns
- [x] Run tests: `pnpm test`

## Phase 5: Factory Layer

- [x] Create `src/factories/proxmox-template.factory.ts` with ProxmoxTemplateFactory
  - Implement createProxmoxTemplateService() method:
    - Load config from environment using proxmox.config
    - Create ProxmoxRepository with config
    - Create ProxmoxTemplateService with repository
    - Return service instance
- [x] Verify factory compiles: `pnpm run build`

## Phase 6: Command Layer

- [x] Create `src/commands/proxmox/template/list.ts` extending Command
  - Add static description
  - Add static examples showing expected table output
  - Implement async run() method:
    - Get service from ProxmoxTemplateFactory
    - Call service.listTemplates()
    - Handle Result failure (convert to oclif error with exit 1)
    - Handle empty list (display "No templates found")
    - Format templates using cli-table3:
      - Columns: VMID, Name, Template
      - Template column: "Yes" for all entries
    - Output table with this.log()
- [x] Write integration tests in `test/commands/proxmox/template/list.test.ts`
  - Mock environment variables (PROXMOX_HOST, PROXMOX_API_TOKEN)
  - Mock repository responses via factory override or DI
  - Test table output format
  - Test empty template list message
  - Test configuration error handling
  - Test service error handling
  - Verify exit code on errors
  - Verify sorting (ascending by vmid)
- [x] Run tests: `pnpm test`

## Phase 7: Integration & Documentation

- [x] Run full build: `pnpm run build`
- [x] Run all tests: `pnpm test`
- [x] Run linter: `pnpm run lint`
- [x] Test command manually with real Proxmox instance:
  - Set environment variables
  - Run `./bin/dev.js proxmox template list`
  - Verify table output
  - Verify sorting
  - Verify error handling (test with invalid credentials)
- [x] Update README via oclif: `pnpm run prepack` (generates manifest and updates README)
- [x] Create example `.env.example` file documenting required environment variables
- [x] Update `package.json` topics to include "proxmox" if needed

## Phase 8: Final Validation

- [x] Ensure all tests pass: `pnpm test`
- [x] Ensure build succeeds: `pnpm run build`
- [x] Ensure linter passes: `pnpm run lint`
- [x] Verify no TypeScript errors: `tsc --noEmit`
- [x] Run command end-to-end with real Proxmox API
- [x] Review code against project conventions
- [x] Update proposal status to complete

## Validation Criteria

- ✓ All unit tests passing (config, repository, service)
- ✓ All integration tests passing (command)
- ✓ Build succeeds without errors
- ✓ Linter passes without warnings
- ✓ Command outputs correctly formatted table
- ✓ Empty list displays "No templates found"
- ✓ Templates sorted by VMID ascending
- ✓ Errors display user-friendly messages and exit with code 1
- ✓ Self-signed SSL certificates accepted
- ✓ API token correctly parsed and used in Authorization header
- ✓ Code follows layered architecture pattern
- ✓ All dependencies explicit via constructor injection
- ✓ Result pattern used consistently across layers
- ✓ Zod validation applied to config and API responses
