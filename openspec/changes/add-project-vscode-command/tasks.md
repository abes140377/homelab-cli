# Tasks: add-project-vscode-command

## Implementation Tasks

### 1. Create command file structure

**File**: `src/commands/project/vscode.ts`

Create the basic command class extending `BaseCommand` with:
- Static description
- Static args definitions (both optional)
- Static examples showing all usage patterns
- Empty `run()` method

**Validation**: File exists and compiles (`pnpm run build`)

---

### 2. Implement project name resolution logic

In the `run()` method:
- Parse arguments using `this.parse(ProjectVscode)`
- Load projects directory config with `loadProjectsDirConfig()`
- If project name provided, use it; otherwise call `detectCurrentProject(process.cwd(), config.projectsDir)`
- Handle detection failure with appropriate error message and exit code 1

**Validation**: Unit test for project detection logic

---

### 3. Implement path construction logic

Add logic to construct paths based on arguments:
- If workspace name provided: `join(config.projectsDir, projectName, workspaceName + '.code-workspace')`
- If workspace name omitted: `join(config.projectsDir, projectName)`
- Use `join` from `node:path` for cross-platform compatibility

**Validation**: Unit test for path construction with various inputs

---

### 4. Implement VS Code process execution

Add function to execute `code` binary:
- Import `spawn` from `node:child_process`
- For workspace file: execute `spawn('code', [workspacePath], {detached: true, stdio: 'ignore'})`
- For project directory: execute `spawn('code', ['.'], {cwd: projectPath, detached: true, stdio: 'ignore'})`
- Unref the process so CLI doesn't wait for VS Code to close
- Handle ENOENT error (command not found) with helpful message

**Validation**: Command executes without errors (manual test with actual VS Code)

---

### 5. Add error handling for all failure cases

Implement error handlers for:
- Configuration loading failure
- Project detection failure (outside projects directory)
- Code binary not found (ENOENT)
- Generic spawn errors

Each error should:
- Display clear, actionable error message
- Exit with status code 1
- Follow error message format from other commands

**Validation**: Unit tests for each error case

---

### 6. Write comprehensive command tests

**File**: `test/commands/project/vscode.test.ts`

Test cases:
- Explicit project and workspace arguments
- Auto-detected project with explicit workspace
- Explicit project without workspace (opens project root)
- Auto-detected project without workspace
- Error: missing code binary (mock ENOENT)
- Error: project detection failure (cwd outside projects)
- Error: config loading failure

Use mocking for:
- `child_process.spawn` to avoid launching VS Code during tests
- `detectCurrentProject` to control detection results
- `loadProjectsDirConfig` to control config

**Validation**: All tests pass (`pnpm test`)

---

### 7. Build and verify command registration

Build the project and verify command appears in help:
- Run `pnpm run build`
- Run `./bin/run.js project --help` to see vscode subcommand listed
- Run `./bin/run.js project vscode --help` to see full command help

**Validation**: Command shows in help output, examples display correctly

---

### 8. Manual integration testing

Test command with actual VS Code installation:
- `./bin/dev.js project vscode` (from within a project)
- `./bin/dev.js project vscode myworkspace` (auto-detect project)
- `./bin/dev.js project vscode myproject` (open project root)
- `./bin/dev.js project vscode myproject myworkspace` (explicit both)

**Validation**: VS Code launches correctly for each scenario

---

### 9. Update README documentation

Run oclif's README generator:
- Execute `pnpm run prepack`
- Verify `project vscode` command appears in README with correct description and examples
- Verify command list is updated

**Validation**: README contains new command documentation

---

### 10. Run full test suite and linting

Final verification:
- Run `pnpm test` to ensure all tests pass
- Run `pnpm run lint` to ensure code meets style guidelines
- Fix any linting issues or test failures

**Validation**: All tests pass, no linting errors

---

## Task Dependencies

```
1 (create file) → 2 (project resolution) → 3 (path construction) → 4 (execution) → 5 (error handling)
                                                                    ↓
                                                                    6 (tests)
                                                                    ↓
                                                                    7 (build)
                                                                    ↓
                                                                    8 (manual test)
                                                                    ↓
                                                                    9 (docs)
                                                                    ↓
                                                                    10 (final verification)
```

Tasks 2-5 can be worked on incrementally with tests added alongside (task 6). After core implementation (tasks 1-6), tasks 7-10 are sequential verification steps.

## Notes

- This command requires no service/repository layer - all logic lives in the command class
- Reuses existing utilities (`detectCurrentProject`, `loadProjectsDirConfig`)
- Uses native Node.js `child_process` for execution
- Process is detached so CLI returns immediately after launching VS Code
