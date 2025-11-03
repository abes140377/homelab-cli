# Tasks: Add Project VSCode Command

## Implementation Checklist

- [x] **Create command file structure**
  - Create file `src/commands/project/vscode.ts`
  - Extend `BaseCommand<typeof ProjectVscode>`
  - Add static `description`, `args`, and `examples` properties
  - Verify: File compiles successfully with `pnpm run build`

- [x] **Implement project name resolution logic**
  - Parse arguments using `this.parse(ProjectVscode)`
  - Load projects directory config with `loadProjectsDirConfig()`
  - If project name not provided, call `detectCurrentProject(process.cwd(), config.projectsDir)`
  - Handle detection failure with error message and exit code 1
  - Verify: Project detection works from within project directories

- [x] **Implement path construction logic**
  - If workspace name provided: construct `join(config.projectsDir, projectName, workspaceName + '.code-workspace')`
  - If workspace name omitted: construct `join(config.projectsDir, projectName)` for project root
  - Use `join` from `node:path` for cross-platform compatibility
  - Verify: Paths are constructed correctly for all argument combinations

- [x] **Implement VS Code process execution**
  - Import `spawn` from `node:child_process`
  - Execute `code` binary with appropriate arguments (workspace path or `.`)
  - Set `cwd` option when opening project root
  - Use `detached: true` and `stdio: 'ignore'` options
  - Wait for spawn event before unreferencing process
  - Display success message after spawn
  - Verify: VS Code launches correctly and CLI returns immediately

- [x] **Add error handling for all failure cases**
  - Handle configuration loading errors
  - Handle project detection failures (outside projects directory)
  - Handle spawn errors with ENOENT (code binary not found)
  - Handle generic spawn errors
  - All errors display clear, actionable messages and exit with code 1
  - Verify: Error messages are helpful and follow project conventions

- [x] **Write comprehensive command tests**
  - Create test file `test/commands/project/vscode.test.ts`
  - Test explicit project and workspace arguments
  - Test auto-detected project with explicit workspace
  - Test explicit project without workspace (opens project root)
  - Test auto-detected project without workspace
  - Test error: project cannot be detected (outside projects directory)
  - Test error: invalid projects directory config
  - Test argument handling: both positional arguments
  - Test output format: workspace vs project messages
  - Test with custom PROJECTS_DIR environment variable
  - Verify: All tests pass with `pnpm test`

- [x] **Build and verify command registration**
  - Run `pnpm run build` successfully
  - Run `pnpm exec oclif manifest` to generate command manifest
  - Verify `./bin/run.js project --help` lists vscode subcommand
  - Verify `./bin/run.js project vscode --help` shows full help with examples
  - Verify: Command appears in help output correctly

- [x] **Manual integration testing**
  - Test `./bin/dev.js project vscode` from within a project (auto-detect project, open root)
  - Test `./bin/dev.js project vscode sflab` (explicit project, open root)
  - Test `./bin/dev.js project vscode sflab homelab-cli` (explicit both, open workspace)
  - Test from `/tmp` to verify error when outside projects directory
  - Verify: VS Code launches correctly for each scenario

- [x] **Update README documentation**
  - Run `pnpm run prepack` to generate manifest and update README
  - Verify `project vscode` command appears in README table of contents
  - Verify command documentation includes description, usage, arguments, and examples
  - Verify command list is updated with new command
  - Verify: README accurately reflects the new command

- [x] **Run full test suite and linting**
  - Run `pnpm test` to ensure all 118 tests pass
  - Run `pnpm run lint` to ensure code meets style guidelines
  - Fix any linting issues (import sorting, line spacing, negated conditions)
  - Verify: All tests pass, no linting errors

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

## Implementation Notes

- This command follows the "command-only" architecture pattern - no service/repository layer needed
- Reuses existing utilities: `detectCurrentProject` and `loadProjectsDirConfig`
- Uses native Node.js `child_process.spawn` for executing VS Code
- Process is detached so CLI returns immediately after launching VS Code
- Handles both workspace files (`.code-workspace`) and project root directories
- All tests pass including edge cases for error handling
