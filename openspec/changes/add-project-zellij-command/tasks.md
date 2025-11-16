# Implementation Tasks

## 1. Implementation

- [x] 1.1 Create command file `src/commands/project/zellij.ts`
  - [x] 1.1.1 Define command class extending `BaseCommand`
  - [x] 1.1.2 Define static args for optional `project-name` and `config-name`
  - [x] 1.1.3 Define static description and examples
  - [x] 1.1.4 Implement `async run()` method
- [x] 1.2 Implement project name detection logic
  - [x] 1.2.1 Load projects directory config using `loadProjectsDirConfig()`
  - [x] 1.2.2 Use explicit `project-name` arg if provided
  - [x] 1.2.3 Otherwise, call `detectCurrentProject(process.cwd(), config.projectsDir)`
  - [x] 1.2.4 Handle detection failure with clear error message
- [x] 1.3 Implement config name detection logic
  - [x] 1.3.1 Use explicit `config-name` arg if provided
  - [x] 1.3.2 Otherwise, detect from current working directory basename using `path.basename(process.cwd())`
- [x] 1.4 Implement Zellij configuration path construction
  - [x] 1.4.1 Construct path: `join(config.projectsDir, projectName, '.config/zellij', `${configName}.kdl`)`
  - [x] 1.4.2 Ensure path expansion handles `~` in projects directory
- [x] 1.5 Implement Zellij process execution
  - [x] 1.5.1 Import `spawn` from `child_process`
  - [x] 1.5.2 Execute `zellij -n <config-path> -s <session-name>` using spawn
  - [x] 1.5.3 Use `stdio: 'inherit'` for interactive terminal control
  - [x] 1.5.4 Wait for process to exit (do NOT detach)
  - [x] 1.5.5 Handle ENOENT error (zellij binary not found)
  - [x] 1.5.6 Handle other spawn errors with appropriate messages
  - [x] 1.5.7 Exit with code 1 on errors, 0 on success

## 2. Testing

- [x] 2.1 Create test file `test/commands/project/zellij.test.ts`
- [x] 2.2 Set up test infrastructure
  - [x] 2.2.1 Import necessary test utilities (`@oclif/test`, `chai`)
  - [x] 2.2.2 Mock `child_process.spawn` to avoid launching real Zellij
  - [x] 2.2.3 Mock `detectCurrentProject` for controlled test scenarios
  - [x] 2.2.4 Mock `loadProjectsDirConfig` for controlled config
- [x] 2.3 Test argument parsing scenarios
  - [x] 2.3.1 Test: Both project and config explicitly provided
  - [x] 2.3.2 Test: Only project provided (config auto-detected from cwd)
  - [x] 2.3.3 Test: Only config provided (project auto-detected)
  - [x] 2.3.4 Test: No arguments (both auto-detected)
- [x] 2.4 Test execution scenarios
  - [x] 2.4.1 Verify spawn called with correct command: `zellij`
  - [x] 2.4.2 Verify spawn called with correct args: `-n`, `<config-path>`, `-s`, `<session-name>`
  - [x] 2.4.3 Verify spawn options include `stdio: 'inherit'`
  - [x] 2.4.4 Verify config path format: `~/projects/<project>/.config/zellij/<config>.kdl`
- [x] 2.5 Test error handling scenarios
  - [x] 2.5.1 Test: Zellij binary not found (ENOENT)
  - [x] 2.5.2 Test: Project detection failure (outside projects directory)
  - [x] 2.5.3 Test: Spawn execution error
  - [x] 2.5.4 Test: Configuration loading failure
- [x] 2.6 Run tests and ensure all pass
  - [x] 2.6.1 Execute: `pnpm exec mocha --forbid-only "test/commands/project/zellij.test.ts"`
  - [x] 2.6.2 Fix any test failures
  - [x] 2.6.3 Verify test coverage is comprehensive

## 3. Build and Validation

- [x] 3.1 Build the project
  - [x] 3.1.1 Run: `pnpm run build`
  - [x] 3.1.2 Resolve any TypeScript compilation errors
- [x] 3.2 Run full test suite
  - [x] 3.2.1 Execute: `pnpm test`
  - [x] 3.2.2 Ensure all tests pass
  - [x] 3.2.3 Ensure linting passes
- [ ] 3.3 Manual testing (optional but recommended)
  - [ ] 3.3.1 Test: `./bin/dev.js project zellij` (auto-detect both)
  - [ ] 3.3.2 Test: `./bin/dev.js project zellij <config>` (auto-detect project)
  - [ ] 3.3.3 Test: `./bin/dev.js project zellij <project> <config>` (explicit both)
  - [ ] 3.3.4 Verify Zellij launches with correct config and session name
  - [ ] 3.3.5 Test error cases (missing zellij, outside project directory)

## 4. Documentation

- [x] 4.1 Update README (auto-generated)
  - [x] 4.1.1 Run: `pnpm run prepack`
  - [x] 4.1.2 Verify `homelab project zellij` appears in commands list
  - [x] 4.1.3 Verify examples are displayed correctly

## 5. Completion Checklist

- [x] 5.1 All tasks marked complete
- [x] 5.2 All tests passing (`pnpm test`)
- [x] 5.3 Build successful (`pnpm run build`)
- [x] 5.4 No TypeScript errors
- [x] 5.5 No linting errors
- [x] 5.6 Command accessible via `./bin/dev.js project zellij`
- [x] 5.7 README updated with new command
