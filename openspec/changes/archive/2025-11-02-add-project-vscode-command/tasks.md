# Implementation Tasks

## 1. Implementation

- [x] 1.1 Create command file `src/commands/project/vscode.ts` extending `BaseCommand`
- [x] 1.2 Define optional args: `project-name` and `workspace-name`
- [x] 1.3 Implement project name detection logic (reuse `detectCurrentProject` utility)
- [x] 1.4 Implement workspace path construction logic
- [x] 1.5 Implement `code` command execution using `child_process.spawn`
- [x] 1.6 Add error handling for missing `code` command, invalid project names, and missing workspace files
- [x] 1.7 Add command description and examples

## 2. Testing

- [x] 2.1 Create test file `test/commands/project/vscode.test.ts`
- [x] 2.2 Add unit tests for explicit project and workspace arguments
- [x] 2.3 Add unit tests for auto-detected project name
- [x] 2.4 Add unit tests for workspace-only mode (code .)
- [x] 2.5 Add unit tests for error cases (missing code binary, invalid paths)
- [x] 2.6 Verify tests pass with `pnpm test`

## 3. Documentation

- [x] 3.1 Run `pnpm run prepack` to update README with new command
- [x] 3.2 Verify command appears in auto-generated documentation

## 4. Quality Checks

- [x] 4.1 Run `pnpm run build` to ensure compilation succeeds
- [x] 4.2 Run `pnpm run lint` to ensure code style compliance
- [x] 4.3 Manually test command: `./bin/dev.js project vscode`
- [x] 4.4 Manually test command: `./bin/dev.js project vscode sflab`
- [x] 4.5 Manually test command: `./bin/dev.js project vscode sflab my-workspace`
