# Implementation Tasks

## 1. Domain Model - Workspace Context

- [ ] 1.1 Create `src/models/workspace-context.dto.ts`
- [ ] 1.2 Define WorkspaceContextDTO type as inferred from schema
- [ ] 1.3 Create `src/models/schemas/workspace-context.schema.ts`
- [ ] 1.4 Define WorkspaceContextSchema with Zod:
  - `id`: string, min length 1
  - `name`: string, min length 1
  - `createdAt`: date
  - `updatedAt`: date
- [ ] 1.5 Modify `src/models/schemas/workspace.schema.ts`:
  - Add `contexts` field: `z.array(WorkspaceContextSchema).optional()`
- [ ] 1.6 Add import for WorkspaceContextSchema
- [ ] 1.7 Verify TypeScript compiles without errors

**Validation:** TypeScript compiles. Schemas can be imported. Type inference works correctly.

## 2. Repository Interface Extension

- [ ] 2.1 Open `src/repositories/interfaces/workspace.repository.interface.ts`
- [ ] 2.2 Add method signature:
  ```typescript
  findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>>
  ```
- [ ] 2.3 Add JSDoc comment describing method purpose
- [ ] 2.4 Verify TypeScript compiles

**Validation:** Interface updated. TypeScript recognizes new method.

## 3. PocketBase Repository - findByName Implementation

- [ ] 3.1 Open `src/repositories/pocketbase-workspace.repository.ts`
- [ ] 3.2 Import WorkspaceContextSchema
- [ ] 3.3 Implement `async findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>>`:
  - Try-catch block for PocketBase operations
  - Authenticate if credentials provided (reuse existing auth logic)
  - Call `this.client.collection('workspaces').getFirstListItem(\`name="${name}"\`, {expand: 'contexts'})`
  - Map record to WorkspaceDTO:
    - id, name, createdAt, updatedAt (existing fields)
    - contexts: map record.expand?.contexts to WorkspaceContextDTO[]
    - For each context: map id, name, created → createdAt, updated → updatedAt
  - Validate with WorkspaceSchema (which now includes contexts)
  - Return success Result
  - Handle ClientResponseError (404 → workspace not found)
  - Handle generic errors
  - Return failure Result with appropriate RepositoryError
- [ ] 3.4 Verify TypeScript compiles
- [ ] 3.5 Verify implements IWorkspaceRepository interface

**Validation:** Repository implements interface. Method compiles and can be called.

## 4. Mock Repository - findByName Implementation

- [ ] 4.1 Open `src/repositories/workspace.repository.ts` (mock repository)
- [ ] 4.2 Add mock contexts data to existing mock workspaces:
  ```typescript
  {
    id: '...',
    name: 'production',
    createdAt: ...,
    updatedAt: ...,
    contexts: [
      { id: 'ctx-1', name: 'backend', createdAt: ..., updatedAt: ... },
      { id: 'ctx-2', name: 'frontend', createdAt: ..., updatedAt: ... },
    ]
  }
  ```
- [ ] 4.3 Implement `async findByName(name: string)`:
  - Find workspace in mockData where workspace.name === name
  - If found: return success(workspace)
  - If not found: return failure(new RepositoryError(\`Workspace '${name}' not found\`))
- [ ] 4.4 Verify TypeScript compiles

**Validation:** Mock repository implements interface. Can be used for testing.

## 5. Repository Tests - findByName

- [ ] 5.1 Open `test/repositories/pocketbase-workspace.repository.test.ts`
- [ ] 5.2 Add test: findByName with valid name returns success with WorkspaceDTO
- [ ] 5.3 Add test: findByName calls getFirstListItem with correct name filter
- [ ] 5.4 Add test: findByName uses expand parameter for contexts
- [ ] 5.5 Add test: Contexts are mapped correctly (created → createdAt, etc.)
- [ ] 5.6 Add test: Empty contexts array when record.expand.contexts is undefined
- [ ] 5.7 Add test: findByName with non-existent name returns failure (404)
- [ ] 5.8 Add test: Error message includes workspace name
- [ ] 5.9 Add test: findByName handles network errors
- [ ] 5.10 Run tests: `pnpm exec mocha --forbid-only "test/repositories/pocketbase-workspace.repository.test.ts"`

**Validation:** All repository tests pass. Contexts mapping verified.

## 6. Service Layer - findWorkspaceByName

- [ ] 6.1 Open `src/services/workspace.service.ts`
- [ ] 6.2 Add method `async findWorkspaceByName(name: string): Promise<Result<WorkspaceDTO, ServiceError>>`:
  - Call `this.repository.findByName(name)`
  - If failure: return failure with ServiceError wrapping repository error
  - If success: validate with WorkspaceSchema (defensive validation)
  - Return success with validated WorkspaceDTO
- [ ] 6.3 Add JSDoc comment
- [ ] 6.4 Verify TypeScript compiles

**Validation:** Service method compiles. Can be called from commands.

## 7. Service Tests - findWorkspaceByName

- [ ] 7.1 Open `test/services/workspace.service.test.ts`
- [ ] 7.2 Add test: findWorkspaceByName with mock repository returning success
- [ ] 7.3 Add test: findWorkspaceByName with repository returning failure
- [ ] 7.4 Add test: Service validation catches invalid data from repository
- [ ] 7.5 Run tests: `pnpm exec mocha --forbid-only "test/services/workspace.service.test.ts"`

**Validation:** Service tests pass. Error handling verified.

## 8. Workspace Launcher Service

- [ ] 8.1 Create `src/services/workspace-launcher.service.ts`
- [ ] 8.2 Import required modules: fs, path, os, child_process, Result, ServiceError
- [ ] 8.3 Define WorkspaceLauncherService class
- [ ] 8.4 Implement `async launchVSCode(workspaceName: string, contextName: string): Promise<Result<void, ServiceError>>`:
  - Construct workspacePath: `path.join(os.homedir(), 'projects', workspaceName, \`${contextName}.code-workspace\`)`
  - Check if file exists: `fs.existsSync(workspacePath)`
  - If not exists: return failure with "Workspace file not found: {path}"
  - Try-catch block:
    - Execute: `execSync(\`code "${workspacePath}"\`, {stdio: 'inherit'})`
    - Return success(undefined)
  - Catch error:
    - Return failure with "Failed to launch VSCode" and cause
- [ ] 8.5 Implement `async openTerminal(workspaceName: string): Promise<Result<void, ServiceError>>`:
  - Construct workspaceDir: `path.join(os.homedir(), 'projects', workspaceName)`
  - Check if directory exists: `fs.existsSync(workspaceDir)`
  - If not exists: return failure with "Workspace directory not found: {path}"
  - Try-catch block:
    - Get shell: `process.env.SHELL || '/bin/bash'`
    - Execute: `spawnSync(shell, [], {cwd: workspaceDir, stdio: 'inherit'})`
    - Return success(undefined)
  - Catch error:
    - Return failure with "Failed to open terminal" and cause
- [ ] 8.6 Add JSDoc comments for class and methods
- [ ] 8.7 Verify TypeScript compiles

**Validation:** Service compiles. Methods can be called. Path construction is correct.

## 9. Launcher Service Tests

- [ ] 9.1 Create `test/services/workspace-launcher.service.test.ts`
- [ ] 9.2 Mock `fs.existsSync` using sinon or similar
- [ ] 9.3 Mock `execSync` and `spawnSync`
- [ ] 9.4 Test launchVSCode: success path (file exists, command succeeds)
- [ ] 9.5 Test launchVSCode: file not found returns failure
- [ ] 9.6 Test launchVSCode: execSync fails returns failure
- [ ] 9.7 Test launchVSCode: path construction is correct
- [ ] 9.8 Test openTerminal: success path (directory exists, spawn succeeds)
- [ ] 9.9 Test openTerminal: directory not found returns failure
- [ ] 9.10 Test openTerminal: spawnSync fails returns failure
- [ ] 9.11 Test openTerminal: path construction is correct
- [ ] 9.12 Test openTerminal: uses $SHELL environment variable
- [ ] 9.13 Test openTerminal: falls back to /bin/bash if $SHELL not set
- [ ] 9.14 Run tests: `pnpm exec mocha --forbid-only "test/services/workspace-launcher.service.test.ts"`

**Validation:** All launcher service tests pass. Mocks work correctly.

## 10. Workspace Start Command

- [ ] 10.1 Create `src/commands/workspace/start.ts`
- [ ] 10.2 Import: Args, Flags, Command, WorkspaceFactory, WorkspaceLauncherService, etc.
- [ ] 10.3 Define class `WorkspaceStart` extending `BaseCommand<typeof WorkspaceStart>`
- [ ] 10.4 Add static description: "Start a workspace in VSCode or terminal"
- [ ] 10.5 Define static args:
  ```typescript
  static args = {
    workspaceName: Args.string({
      description: 'Name of the workspace to start',
      required: true,
    }),
  }
  ```
- [ ] 10.6 Define static flags:
  ```typescript
  static flags = {
    vscode: Flags.boolean({
      char: 'v',
      description: 'Open workspace in VSCode',
      exclusive: ['terminal'],
    }),
    terminal: Flags.boolean({
      char: 't',
      description: 'Open workspace in terminal',
      exclusive: ['vscode'],
    }),
    context: Flags.string({
      char: 'c',
      description: 'Context name (required when workspace has multiple contexts)',
      dependsOn: ['vscode'],
    }),
  }
  ```
- [ ] 10.7 Add static examples showing usage
- [ ] 10.8 Implement `async run(): Promise<void>`:
  - Parse args and flags
  - Validate exactly one of --vscode or --terminal provided
  - Create workspace service from factory
  - Call `service.findWorkspaceByName(workspaceName)`
  - Handle workspace not found error
  - Extract contexts from workspace
  - If --vscode flag:
    - Check contexts.length === 0: error "No contexts found"
    - If contexts.length === 1: auto-select context
    - If contexts.length > 1 and !flags.context: error with context list
    - If flags.context: find matching context or error
    - Create launcher service
    - Call `launcher.launchVSCode(workspaceName, contextName)`
    - Handle launch errors
  - If --terminal flag:
    - Create launcher service
    - Call `launcher.openTerminal(workspaceName)`
    - Handle launch errors
  - Log success message
- [ ] 10.9 Verify TypeScript compiles
- [ ] 10.10 Test manually: `./bin/dev.js workspace start --help`

**Validation:** Command compiles. Help text displays correctly. Can be invoked.

## 11. Command Tests

- [ ] 11.1 Create `test/commands/workspace/start.test.ts`
- [ ] 11.2 Use `@oclif/test` runCommand utility
- [ ] 11.3 Mock WorkspaceFactory to return service with mock repository
- [ ] 11.4 Mock WorkspaceLauncherService methods
- [ ] 11.5 Test: No flags provided shows error
- [ ] 11.6 Test: --vscode with single context calls launchVSCode
- [ ] 11.7 Test: --vscode with multiple contexts and --context flag
- [ ] 11.8 Test: --vscode with multiple contexts without --context shows error
- [ ] 11.9 Test: --vscode with invalid context shows error
- [ ] 11.10 Test: --vscode with no contexts shows error
- [ ] 11.11 Test: --terminal calls openTerminal
- [ ] 11.12 Test: Workspace not found shows error with suggestion
- [ ] 11.13 Test: Launcher service errors are displayed
- [ ] 11.14 Run tests: `pnpm exec mocha --forbid-only "test/commands/workspace/start.test.ts"`

**Validation:** All command tests pass. Flag validation works. Error messages are correct.

## 12. Build and Full Test Suite

- [ ] 12.1 Run full build: `pnpm run build`
- [ ] 12.2 Run all tests: `pnpm test`
- [ ] 12.3 Fix any linting issues reported by ESLint
- [ ] 12.4 Verify no TypeScript compilation errors
- [ ] 12.5 Verify all tests pass

**Validation:** Build succeeds. All tests pass. No linting errors.

## 13. Manual Testing - VSCode Launch

- [ ] 13.1 Ensure workspace exists in PocketBase with contexts
- [ ] 13.2 Ensure workspace directory exists at ~/projects/<workspace-name>/
- [ ] 13.3 Ensure .code-workspace files exist for each context
- [ ] 13.4 Test: `./bin/dev.js workspace start <name> --vscode` (single context)
- [ ] 13.5 Verify VSCode launches with correct workspace file
- [ ] 13.6 Test: `./bin/dev.js workspace start <name> --vscode --context <ctx>` (multiple contexts)
- [ ] 13.7 Verify VSCode launches with specified context
- [ ] 13.8 Test error: Multiple contexts without --context flag
- [ ] 13.9 Test error: Invalid context name
- [ ] 13.10 Test error: Workspace not in PocketBase
- [ ] 13.11 Test error: Workspace file missing on filesystem

**Validation:** VSCode launches correctly. Error messages are clear and helpful.

## 14. Manual Testing - Terminal Launch

- [ ] 14.1 Test: `./bin/dev.js workspace start <name> --terminal`
- [ ] 14.2 Verify shell spawns at correct directory
- [ ] 14.3 Verify can execute commands in spawned shell
- [ ] 14.4 Verify can exit shell to return to original terminal
- [ ] 14.5 Test error: Workspace directory missing on filesystem
- [ ] 14.6 Test with different $SHELL values (bash, zsh, etc.)

**Validation:** Terminal opens at correct location. Shell is interactive. Exit works.

## 15. Manual Testing - Edge Cases

- [ ] 15.1 Test workspace name with spaces (if applicable)
- [ ] 15.2 Test context name with special characters
- [ ] 15.3 Test with no PocketBase connection (error handling)
- [ ] 15.4 Test with workspace that has no contexts (VSCode error)
- [ ] 15.5 Test production build: `./bin/run.js workspace start <name> --vscode`

**Validation:** Edge cases handled gracefully. No crashes or unclear errors.

## 16. Documentation

- [ ] 16.1 Run `pnpm run prepack` to regenerate README
- [ ] 16.2 Verify README contains `workspace start` command
- [ ] 16.3 Verify command description is clear
- [ ] 16.4 Verify flags are documented
- [ ] 16.5 Verify examples are included
- [ ] 16.6 Check that auto-generated docs are correct

**Validation:** README updated with accurate command documentation.

## 17. Final Validation

- [ ] 17.1 Review all files created/modified
- [ ] 17.2 Ensure all imports use `.js` extensions (ES modules)
- [ ] 17.3 Ensure no `any` types (use proper TypeScript types)
- [ ] 17.4 Verify all error messages are user-friendly
- [ ] 17.5 Verify Result pattern used consistently
- [ ] 17.6 Verify Zod schemas validate all data
- [ ] 17.7 Verify mutually exclusive flags work correctly
- [ ] 17.8 Verify context auto-selection logic
- [ ] 17.9 Run final build and test: `pnpm run build && pnpm test`

**Validation:** All checks pass. Code follows project conventions.

## Notes

### Implementation Order

- Follow tasks sequentially (1-17)
- Each task builds on previous tasks
- Validate after each section before proceeding
- Commit working code incrementally after sections: 2, 5, 7, 9, 12, 16

### Key Patterns to Follow

- **ES Modules**: Use `.js` extensions in imports
- **Result Pattern**: All repository/service methods return `Result<T, E>`
- **Zod Validation**: Use schemas for runtime validation
- **Dependency Injection**: Constructor-based injection via factory
- **Error Handling**: Catch all errors, return descriptive errors
- **Testing**: Test behavior, not implementation; mock at service/repository boundary
- **oclif Flags**: Use `exclusive`, `dependsOn` for flag relationships

### Dependencies Between Tasks

- Tasks 1-2 can be completed independently (models and interface)
- Task 3 depends on Task 2 (implements interface)
- Task 4 depends on Task 1 (uses context model)
- Task 5 depends on Task 3 (tests implementation)
- Tasks 6-7 depend on Tasks 1-3 (service uses repository)
- Tasks 8-9 are independent (launcher service)
- Task 10 depends on Tasks 6, 8 (command uses both services)
- Task 11 depends on Task 10 (tests command)
- Tasks 12-17 depend on all previous tasks

### PocketBase Setup Verification

Before manual testing, verify PocketBase configuration:

1. PocketBase running at configured URL
2. 'workspaces' collection exists with records
3. 'contexts' collection exists with records
4. Relation between workspaces and contexts is configured
5. At least one workspace has one context
6. At least one workspace has multiple contexts (for testing context selection)

### Testing Strategy

- **Unit Tests**: Mock dependencies, test in isolation
- **Command Tests**: Mock services via factory, test output and errors
- **Manual Tests**: Real PocketBase, real filesystem, real VSCode/terminal
- Use `--forbid-only` to prevent focused tests in commits

### VSCode CLI Setup

If `code` command not available:

1. Open VSCode
2. Open Command Palette (Cmd+Shift+P)
3. Type "Shell Command: Install 'code' command in PATH"
4. Restart terminal
5. Verify: `which code`
