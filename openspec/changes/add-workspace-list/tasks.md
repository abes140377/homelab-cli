# Implementation Tasks

## 1. Foundation - Utilities and Base Errors

- [ ] 1.1 Create `src/utils/result.ts` with `Result<T, E>` type definition
- [ ] 1.2 Create `src/errors/base.error.ts` with `BaseError` class extending `Error`
- [ ] 1.3 Create `src/errors/repository.error.ts` with `RepositoryError` class
- [ ] 1.4 Create `src/errors/service.error.ts` with `ServiceError` class

**Validation:** TypeScript compiles without errors. Error classes are instantiable.

## 2. Model Layer - Schemas and DTOs

- [ ] 2.1 Create directory `src/models/schemas/`
- [ ] 2.2 Create `src/models/schemas/workspace.schema.ts` with Zod schema for workspace
- [ ] 2.3 Create `src/models/workspace.dto.ts` with `WorkspaceDTO` type inferred from schema

**Validation:** TypeScript infers correct types. Zod schema validates sample data successfully.

## 3. Repository Layer - Interface and Implementation

- [ ] 3.1 Create directory `src/repositories/interfaces/`
- [ ] 3.2 Create `src/repositories/interfaces/workspace.repository.interface.ts` with `IWorkspaceRepository` interface
- [ ] 3.3 Create `src/repositories/workspace.repository.ts` implementing `IWorkspaceRepository`
- [ ] 3.4 Add mock data array with 3 sample workspaces in repository
- [ ] 3.5 Implement `findAll()` method returning `Result<WorkspaceDTO[], RepositoryError>`

**Validation:** Repository can be instantiated. `findAll()` returns success Result with 3 workspaces. Mock data passes Zod validation.

## 4. Repository Tests

- [ ] 4.1 Create directory `test/repositories/`
- [ ] 4.2 Create `test/repositories/workspace.repository.test.ts`
- [ ] 4.3 Test `findAll()` returns success Result
- [ ] 4.4 Test returned data has exactly 3 workspaces
- [ ] 4.5 Test each workspace has id, name, createdAt, updatedAt fields
- [ ] 4.6 Test data consistency across multiple calls
- [ ] 4.7 Run tests: `pnpm exec mocha --forbid-only "test/repositories/workspace.repository.test.ts"`

**Validation:** All repository tests pass.

## 5. Service Layer

- [ ] 5.1 Create directory `src/services/`
- [ ] 5.2 Create `src/services/workspace.service.ts` with `WorkspaceService` class
- [ ] 5.3 Implement constructor accepting `IWorkspaceRepository` parameter
- [ ] 5.4 Implement `listWorkspaces()` method returning `Result<WorkspaceDTO[], ServiceError>`
- [ ] 5.5 Method calls repository `findAll()` and handles Result
- [ ] 5.6 Validate returned data using `WorkspaceSchema.array()`

**Validation:** Service compiles. Can be instantiated with repository. Method signature is correct.

## 6. Service Tests

- [ ] 6.1 Create directory `test/services/`
- [ ] 6.2 Create `test/services/workspace.service.test.ts`
- [ ] 6.3 Create mock repository implementing `IWorkspaceRepository`
- [ ] 6.4 Test success path: mock returns success → service returns success with data
- [ ] 6.5 Test failure path: mock returns error → service returns error
- [ ] 6.6 Test Zod validation is applied to repository results
- [ ] 6.7 Test with empty workspace array
- [ ] 6.8 Run tests: `pnpm exec mocha --forbid-only "test/services/workspace.service.test.ts"`

**Validation:** All service tests pass.

## 7. Factory Layer

- [ ] 7.1 Create directory `src/factories/`
- [ ] 7.2 Create `src/factories/workspace.factory.ts` with `WorkspaceFactory` class
- [ ] 7.3 Implement static method `createWorkspaceService()` returning `WorkspaceService`
- [ ] 7.4 Factory instantiates `WorkspaceRepository` and injects it into `WorkspaceService`

**Validation:** Factory method returns fully-wired service instance.

## 8. Command Layer

- [ ] 8.1 Create directory `src/commands/workspace/`
- [ ] 8.2 Create `src/commands/workspace/list.ts` extending oclif `Command`
- [ ] 8.3 Add static description: "List all workspaces"
- [ ] 8.4 Implement `async run()` method
- [ ] 8.5 Get service from `WorkspaceFactory.createWorkspaceService()`
- [ ] 8.6 Call `service.listWorkspaces()` and handle Result
- [ ] 8.7 On success: format output as table with id, name, createdAt, updatedAt columns
- [ ] 8.8 On failure: call `this.error()` with user-friendly message and exit code 1
- [ ] 8.9 Handle empty workspace list with appropriate message

**Validation:** Command compiles. Can be invoked via `./bin/dev.js workspace list`.

## 9. Command Tests

- [ ] 9.1 Create directory `test/commands/workspace/`
- [ ] 9.2 Create `test/commands/workspace/list.test.ts`
- [ ] 9.3 Test successful execution: output contains workspace names
- [ ] 9.4 Test output formatting: verify table structure
- [ ] 9.5 Test with mock factory returning empty workspace list
- [ ] 9.6 Run tests: `pnpm exec mocha --forbid-only "test/commands/workspace/list.test.ts"`

**Validation:** All command tests pass.

## 10. Integration and Build

- [ ] 10.1 Run full build: `pnpm run build`
- [ ] 10.2 Run all tests: `pnpm test`
- [ ] 10.3 Fix any linting issues reported by ESLint
- [ ] 10.4 Manually test command: `./bin/dev.js workspace list`
- [ ] 10.5 Verify output shows 3 workspaces with correct data
- [ ] 10.6 Test production build: `./bin/run.js workspace list`

**Validation:** Build succeeds. All tests pass. Linter reports no errors. Command works in both dev and production modes.

## 11. Documentation

- [ ] 11.1 Run `pnpm run prepack` to regenerate README with new command
- [ ] 11.2 Verify README contains `workspace list` command documentation

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
