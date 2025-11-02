# Implementation Tasks

## 1. Implementation

- [ ] 1.1 Create command file `src/commands/project/vscode.ts` extending `BaseCommand`
- [ ] 1.2 Define optional args: `project-name` and `workspace-name`
- [ ] 1.3 Implement project name detection logic (reuse `detectCurrentProject` utility)
- [ ] 1.4 Implement workspace path construction logic
- [ ] 1.5 Implement `code` command execution using `child_process.spawn`
- [ ] 1.6 Add error handling for missing `code` command, invalid project names, and missing workspace files
- [ ] 1.7 Add command description and examples

## 2. Testing

- [ ] 2.1 Create test file `test/commands/project/vscode.test.ts`
- [ ] 2.2 Add unit tests for explicit project and workspace arguments
- [ ] 2.3 Add unit tests for auto-detected project name
- [ ] 2.4 Add unit tests for workspace-only mode (code .)
- [ ] 2.5 Add unit tests for error cases (missing code binary, invalid paths)
- [ ] 2.6 Verify tests pass with `pnpm test`

## 3. Documentation

- [ ] 3.1 Run `pnpm run prepack` to update README with new command
- [ ] 3.2 Verify command appears in auto-generated documentation

## 4. Quality Checks

- [ ] 4.1 Run `pnpm run build` to ensure compilation succeeds
- [ ] 4.2 Run `pnpm run lint` to ensure code style compliance
- [ ] 4.3 Manually test command: `./bin/dev.js project vscode`
- [ ] 4.4 Manually test command: `./bin/dev.js project vscode sflab`
- [ ] 4.5 Manually test command: `./bin/dev.js project vscode sflab my-workspace`
