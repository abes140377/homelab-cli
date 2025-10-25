# Implementation Tasks

## 1. Foundation - Utilities and Base Errors

- [x] 1.1 Create `src/utils/result.ts` with `Result<T, E>` type definition
- [x] 1.2 Create `src/errors/base.error.ts` with `BaseError` class extending `Error`
- [x] 1.3 Create `src/errors/repository.error.ts` with `RepositoryError` class
- [x] 1.4 Create `src/errors/service.error.ts` with `ServiceError` class

**Validation:** TypeScript compiles without errors. Error classes are instantiable.

## 2. Model Layer - Schemas and DTOs

- [x] 2.1 Create directory `src/models/schemas/`
- [x] 2.2 Create `src/models/schemas/workspace.schema.ts` with Zod schema for workspace
- [x] 2.3 Create `src/models/workspace.dto.ts` with `WorkspaceDTO` type inferred from schema

**Validation:** TypeScript infers correct types. Zod schema validates sample data successfully.

## 3. Repository Layer - Interface and Implementation

- [x] 3.1 Create directory `src/repositories/interfaces/`
- [x] 3.2 Create `src/repositories/interfaces/workspace.repository.interface.ts` with `IWorkspaceRepository` interface
- [x] 3.3 Create `src/repositories/workspace.repository.ts` implementing `IWorkspaceRepository`
- [x] 3.4 Add mock data array with 3 sample workspaces in repository
- [x] 3.5 Implement `findAll()` method returning `Result<WorkspaceDTO[], RepositoryError>`

**Validation:** Repository can be instantiated. `findAll()` returns success Result with 3 workspaces. Mock data passes Zod validation.

## 4. Repository Tests

- [x] 4.1 Create directory `test/repositories/`
- [x] 4.2 Create `test/repositories/workspace.repository.test.ts`
- [x] 4.3 Test `findAll()` returns success Result
- [x] 4.4 Test returned data has exactly 3 workspaces
- [x] 4.5 Test each workspace has id, name, createdAt, updatedAt fields
- [x] 4.6 Test data consistency across multiple calls
- [x] 4.7 Run tests: `pnpm exec mocha --forbid-only "test/repositories/workspace.repository.test.ts"`

**Validation:** All repository tests pass.

## 5. Service Layer

- [x] 5.1 Create directory `src/services/`
- [x] 5.2 Create `src/services/workspace.service.ts` with `WorkspaceService` class
- [x] 5.3 Implement constructor accepting `IWorkspaceRepository` parameter
- [x] 5.4 Implement `listWorkspaces()` method returning `Result<WorkspaceDTO[], ServiceError>`
- [x] 5.5 Method calls repository `findAll()` and handles Result
- [x] 5.6 Validate returned data using `WorkspaceSchema.array()`

**Validation:** Service compiles. Can be instantiated with repository. Method signature is correct.

## 6. Service Tests

- [x] 6.1 Create directory `test/services/`
- [x] 6.2 Create `test/services/workspace.service.test.ts`
- [x] 6.3 Create mock repository implementing `IWorkspaceRepository`
- [x] 6.4 Test success path: mock returns success → service returns success with data
- [x] 6.5 Test failure path: mock returns error → service returns error
- [x] 6.6 Test Zod validation is applied to repository results
- [x] 6.7 Test with empty workspace array
- [x] 6.8 Run tests: `pnpm exec mocha --forbid-only "test/services/workspace.service.test.ts"`

**Validation:** All service tests pass.

## 7. Factory Layer

- [x] 7.1 Create directory `src/factories/`
- [x] 7.2 Create `src/factories/workspace.factory.ts` with `WorkspaceFactory` class
- [x] 7.3 Implement static method `createWorkspaceService()` returning `WorkspaceService`
- [x] 7.4 Factory instantiates `WorkspaceRepository` and injects it into `WorkspaceService`

**Validation:** Factory method returns fully-wired service instance.

## 8. Command Layer

- [x] 8.1 Create directory `src/commands/workspace/`
- [x] 8.2 Create `src/commands/workspace/list.ts` extending oclif `Command`
- [x] 8.3 Add static description: "List all workspaces"
- [x] 8.4 Implement `async run()` method
- [x] 8.5 Get service from `WorkspaceFactory.createWorkspaceService()`
- [x] 8.6 Call `service.listWorkspaces()` and handle Result
- [x] 8.7 On success: format output as table with id, name, createdAt, updatedAt columns
- [x] 8.8 On failure: call `this.error()` with user-friendly message and exit code 1
- [x] 8.9 Handle empty workspace list with appropriate message

**Validation:** Command compiles. Can be invoked via `./bin/dev.js workspace list`.

## 9. Command Tests

- [x] 9.1 Create directory `test/commands/workspace/`
- [x] 9.2 Create `test/commands/workspace/list.test.ts`
- [x] 9.3 Test successful execution: output contains workspace names
- [x] 9.4 Test output formatting: verify table structure
- [x] 9.5 Test with mock factory returning empty workspace list
- [x] 9.6 Run tests: `pnpm exec mocha --forbid-only "test/commands/workspace/list.test.ts"`

**Validation:** All command tests pass.

## 10. Integration and Build

- [x] 10.1 Run full build: `pnpm run build`
- [x] 10.2 Run all tests: `pnpm test`
- [x] 10.3 Fix any linting issues reported by ESLint
- [x] 10.4 Manually test command: `./bin/dev.js workspace list`
- [x] 10.5 Verify output shows 3 workspaces with correct data
- [x] 10.6 Test production build: `./bin/run.js workspace list`

**Validation:** Build succeeds. All tests pass. Linter reports no errors. Command works in both dev and production modes.

## 11. Documentation

- [x] 11.1 Run `pnpm run prepack` to regenerate README with new command
- [x] 11.2 Verify README contains `workspace list` command documentation

**Validation:** README updated automatically by oclif.

## Notes

- Implement tasks sequentially in order
- Each task builds on previous tasks
- Run validation after each section before proceeding
- If any test fails, fix before moving to next section
- Commit working code incrementally (after sections 4, 6, 9, 10)
- All code must follow TypeScript strict mode
- Use ES modules (`.js` extensions in imports after compilation)
- Follow existing code style (prettier/eslint)
