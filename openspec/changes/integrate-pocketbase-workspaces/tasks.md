# Implementation Tasks

## 1. Install PocketBase SDK

- [x] 1.1 Run `pnpm add pocketbase` to install PocketBase JavaScript SDK
- [x] 1.2 Verify package appears in package.json dependencies
- [x] 1.3 Verify pnpm-lock.yaml is updated
- [x] 1.4 Test import: Create temporary file to verify `import PocketBase from 'pocketbase'` works

**Validation:** TypeScript recognizes PocketBase import. No compilation errors.

## 2. Configuration Layer - Schema and Loader

- [x] 2.1 Create `src/config/schemas/pocketbase-config.schema.ts`
- [x] 2.2 Define `PocketBaseConfigSchema` with Zod:
  - `url`: string, URL validation, required
  - `adminEmail`: string, email validation, optional
  - `adminPassword`: string, min length 1, optional
- [x] 2.3 Create `src/config/pocketbase.config.ts`
- [x] 2.4 Define `PocketBaseConfig` type inferred from schema
- [x] 2.5 Implement `loadPocketBaseConfig()` function:
  - Read POCKETBASE_URL from already provided environment variables (required)
  - Read POCKETBASE_ADMIN_EMAIL from already provided environment variables (optional)
  - Read POCKETBASE_ADMIN_PASSWORD from already provided environment variables (optional)
  - Throw descriptive error if POCKETBASE_URL missing
  - Use `safeParse()` to validate and return validated config
  - Throw validation error if schema validation fails

**Validation:** TypeScript compiles. Config function can be imported. Test manually with env vars.

## 3. Configuration Tests

- [x] 3.1 Create `test/config/pocketbase.config.test.ts`
- [x] 3.2 Test: Valid config with all fields loads successfully
- [x] 3.3 Test: Valid config with only URL (no auth) loads successfully
- [x] 3.4 Test: Missing POCKETBASE_URL throws error with message
- [x] 3.5 Test: Invalid URL format fails Zod validation
- [x] 3.6 Test: Invalid email format fails validation
- [x] 3.7 Run tests: `pnpm exec mocha --forbid-only "test/config/pocketbase.config.test.ts"`

**Validation:** All configuration tests pass.

## 4. PocketBase Workspace Repository

- [x] 4.1 Create `src/repositories/pocketbase-workspace.repository.ts`
- [x] 4.2 Define `PocketBaseWorkspaceRepository` class implementing `IWorkspaceRepository`
- [x] 4.3 Add private field: `client: PocketBase`
- [x] 4.4 Implement constructor accepting `PocketBaseConfig`:
  - Initialize `this.client = new PocketBase(config.url)`
  - Store config for potential auth usage
- [x] 4.5 Implement `async findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>>`:
  - Try-catch block for all PocketBase operations
  - If config has adminEmail and adminPassword, call `await this.client.admins.authWithPassword(email, password)`
  - Call `const records = await this.client.collection('workspaces').getFullList()`
  - Map each record to WorkspaceDTO:
    - `id: record.id`
    - `name: record.name`
    - `createdAt: new Date(record.created)`
    - `updatedAt: new Date(record.updated)`
  - Validate mapped data using `WorkspaceSchema.parse()`
  - Return `success(workspaces)`
  - On error: Check if ClientResponseError, extract status/message
  - Return `failure(new RepositoryError(message, error))`
- [x] 4.6 Add proper imports: PocketBase, ClientResponseError, IWorkspaceRepository, etc.

**Validation:** TypeScript compiles. Repository implements interface correctly. Can be instantiated.

## 5. Repository Tests - Mock PocketBase Client

- [x] 5.1 Create `test/repositories/pocketbase-workspace.repository.test.ts`
- [x] 5.2 Create mock PocketBase client for testing
- [x] 5.3 Test: `findAll()` with valid data returns success Result with WorkspaceDTO[]
- [x] 5.4 Test: Records are mapped correctly (created → createdAt, updated → updatedAt)
- [x] 5.5 Test: Authentication called when credentials provided
- [x] 5.6 Test: Authentication NOT called when credentials absent
- [x] 5.7 Test: Connection error returns failure Result with RepositoryError
- [x] 5.8 Test: Authentication error returns failure Result
- [x] 5.9 Test: ClientResponseError (404, 403, etc.) returns appropriate error message
- [x] 5.10 Test: Invalid data fails Zod validation, returns failure Result
- [x] 5.11 Test: Empty collection returns success Result with empty array
- [x] 5.12 Run tests: `pnpm exec mocha --forbid-only "test/repositories/pocketbase-workspace.repository.test.ts"`

**Validation:** All repository tests pass. Mock client behaves as expected.

## 6. PocketBase Workspace Factory

- [x] 6.1 Create `src/factories/pocketbase-workspace.factory.ts`
- [x] 6.2 Define `PocketBaseWorkspaceFactory` class
- [x] 6.3 Implement static method `createWorkspaceService(): WorkspaceService`:
  - Call `const config = loadPocketBaseConfig()`
  - Create `const repository = new PocketBaseWorkspaceRepository(config)`
  - Create `const service = new WorkspaceService(repository)`
  - Return service
- [x] 6.4 Add proper imports: WorkspaceService, PocketBaseWorkspaceRepository, loadPocketBaseConfig

**Validation:** Factory method returns WorkspaceService instance. TypeScript compiles.

## 7. Command Layer

- [x] 7.1 Create `src/commands/workspace/list-pocketbase.ts`
- [x] 7.2 Define class `WorkspaceListPocketbase` extending `Command` from `@oclif/core`
- [x] 7.3 Add static description: "List all workspaces from PocketBase"
- [x] 7.4 Add static examples showing command usage
- [x] 7.5 Implement `async run(): Promise<void>`:
  - Call `await this.parse(WorkspaceListPocketbase)`
  - Try-catch for config/service creation errors
  - Call `const service = PocketBaseWorkspaceFactory.createWorkspaceService()`
  - Call `const result = await service.listWorkspaces()`
  - If `!result.success`: Call `this.error()` with message and exit code 1
  - If `workspaces.length === 0`: Log "No workspaces found." and return
  - Create table using `cli-table3` with headers: ID, Name, Created At, Updated At
  - Format dates using `date-fns` format function (same as existing list command)
  - Add rows to table for each workspace
  - Log table using `this.log(table.toString())`
- [x] 7.6 Add imports: Table from cli-table3, format from date-fns, factory, etc.

**Validation:** Command compiles. Can be invoked via `./bin/dev.js workspace list-pocketbase`.

## 8. Command Tests

- [x] 8.1 Create `test/commands/workspace/list-pocketbase.test.ts`
- [x] 8.2 Use `@oclif/test` utilities for command testing
- [x] 8.3 Test: Missing POCKETBASE_URL shows error message
- [x] 8.4 Test: With mock factory returning success, output contains workspace names
- [x] 8.5 Test: With mock factory returning success, output is formatted as table
- [x] 8.6 Test: With mock factory returning empty array, shows "No workspaces found."
- [x] 8.7 Test: With mock factory returning error, command shows error and exits non-zero
- [x] 8.8 Run tests: `pnpm exec mocha --forbid-only "test/commands/workspace/list-pocketbase.test.ts"`

**Validation:** All command tests pass.

## 9. Integration Tests (Optional)

- [x] 9.1 Create `test/integration/pocketbase-workspace.integration.test.ts`
- [x] 9.2 Check if POCKETBASE_URL environment variable is set
- [x] 9.3 Skip test if POCKETBASE_URL not configured (use Mocha `it.skip()` or conditional)
- [x] 9.4 Test: Real API call to PocketBase fetches workspaces
- [x] 9.5 Test: Verify returned data structure matches WorkspaceDTO
- [x] 9.6 Test: Handle authentication if credentials provided
- [x] 9.7 Run tests: `pnpm exec mocha --forbid-only "test/integration/pocketbase-workspace.integration.test.ts"`

**Validation:** Integration tests pass when PocketBase is available, skip gracefully otherwise.

## 10. Build and Full Test Suite

- [x] 10.1 Run full build: `pnpm run build`
- [x] 10.2 Run all tests: `pnpm test`
- [x] 10.3 Fix any linting issues reported by ESLint
- [x] 10.4 Verify no TypeScript compilation errors
- [x] 10.5 Verify all tests pass

**Validation:** Build succeeds. All tests pass. No linting errors.

## 11. Manual Testing

- [x] 11.1 Test required environment variables are set:

  - POCKETBASE_URL=http://127.0.0.1:8090
  - POCKETBASE_ADMIN_EMAIL=admin@example.com  # optional
  - POCKETBASE_ADMIN_PASSWORD=your-password   # optional
- [x] 11.2 Test command in development mode: `./bin/dev.js workspace list-pocketbase`
- [x] 11.3 Verify output shows workspaces from PocketBase
- [x] 11.4 Test with missing POCKETBASE_URL: Verify clear error message
- [x] 11.5 Test with wrong URL: Verify connection error message
- [x] 11.6 Test with invalid credentials: Verify auth error message
- [x] 11.7 Test production build: `./bin/run.js workspace list-pocketbase`

**Validation:** Command works correctly in both dev and production modes. Error messages are clear and helpful.

## 12. Compare with Mock Command

- [x] 12.1 Run existing mock command: `./bin/dev.js workspace list`
- [x] 12.2 Run new PocketBase command: `./bin/dev.js workspace list-pocketbase`
- [x] 12.3 Verify both commands use same table format
- [x] 12.4 Verify data structure is consistent (id, name, createdAt, updatedAt)

**Validation:** Both commands have consistent output formatting.

## 13. Documentation

- [x] 13.1 Run `pnpm run prepack` to regenerate README
- [x] 13.2 Verify README contains `workspace list-pocketbase` command
- [x] 13.3 Verify command description is clear
- [x] 13.4 Check that examples are included

**Validation:** README is updated with new command documentation.

## 14. Final Validation

- [x] 14.1 Review all files created/modified
- [x] 14.2 Ensure all imports use `.js` extensions (ES modules)
- [x] 14.3 Ensure no `any` types (use proper TypeScript types)
- [x] 14.4 Verify all error messages are user-friendly
- [x] 14.5 Verify Result pattern used consistently
- [x] 14.6 Run final build and test: `pnpm run build && pnpm test`

**Validation:** All checks pass. Code follows project conventions.

## Notes

### Implementation Order

- Follow tasks sequentially (1-14)
- Each task builds on previous tasks
- Validate after each section before proceeding
- Commit working code incrementally after sections: 3, 5, 8, 10, 13

### Key Patterns to Follow

- **ES Modules**: Use `.js` extensions in imports
- **Result Pattern**: All repository/service methods return `Result<T, E>`
- **Zod Validation**: Use schemas for runtime validation
- **Dependency Injection**: Constructor-based injection via factory
- **Error Handling**: Catch all errors, return descriptive RepositoryError
- **Testing**: Test behavior, not implementation; mock at repository boundary

### Dependencies Between Tasks

- Tasks 1-3 can be completed independently
- Task 4 depends on Task 2 (needs config)
- Task 5 depends on Task 4 (tests repository)
- Task 6 depends on Task 4 (factory uses repository)
- Task 7 depends on Task 6 (command uses factory)
- Task 8 depends on Task 7 (tests command)
- Tasks 9-14 depend on all previous tasks

### PocketBase Setup

If PocketBase is not yet set up locally:

1. Download PocketBase from https://pocketbase.io/docs/
2. Run: `./pocketbase serve`
3. Access admin UI: http://127.0.0.1:8090/_/
4. Create 'workspaces' collection with fields: name (text)
5. Add sample workspace records

### Testing Strategy

- **Unit Tests**: Mock PocketBase client, test in isolation
- **Command Tests**: Mock factory, test output formatting
- **Integration Tests**: Optional, requires real PocketBase instance
- Use `--forbid-only` to prevent focused tests in commits
