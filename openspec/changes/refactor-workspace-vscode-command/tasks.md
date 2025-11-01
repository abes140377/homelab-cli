# Implementation Tasks

## Task Breakdown

### 1. Create new vscode command file
**File**: `src/commands/workspace/vscode.ts`
**Description**: Create the new command file with proper structure
**Details**:
- Create new file at `src/commands/workspace/vscode.ts`
- Extend BaseCommand
- Define two required positional arguments: workspaceName, contextName
- Add description: "Open a workspace context in VSCode"
- Add examples demonstrating usage
- No flags needed (remove all flag definitions)

**Validation**:
- File exists at correct path
- Compiles without errors
- Command shows in help output as `homelab workspace vscode`

**Dependencies**: None

---

### 2. Implement command execution logic
**File**: `src/commands/workspace/vscode.ts`
**Description**: Implement the run() method with simplified logic
**Details**:
- Parse arguments (workspaceName, contextName)
- Get workspace service from factory
- Call findWorkspaceByName(workspaceName)
- Handle workspace not found error
- Validate contexts array is not empty
- Find matching context by name (case-sensitive)
- Handle context not found error with available contexts list
- Create WorkspaceLauncherService instance
- Call launchVSCode(workspaceName, contextName)
- Handle launcher result (success/failure)
- Display appropriate success or error message

**Validation**:
- Logic compiles without errors
- All Result types are handled
- Error messages match spec requirements

**Dependencies**: Task 1 (command file exists)

---

### 3. Remove terminal-related code
**Description**: Clean up all terminal support from the command
**Details**:
- No `--terminal` flag definition
- No `--vscode` flag definition
- No `--context` flag definition
- No flag mutual exclusivity logic
- No terminal mode conditional logic
- No calls to launcherService.openTerminal()

**Validation**:
- No references to terminal in vscode.ts
- No flag definitions in the command
- grep for 'terminal' in file returns no results

**Dependencies**: Task 2 (implementation complete)

---

### 4. Update command tests
**File**: `test/commands/workspace/vscode.test.ts`
**Description**: Create comprehensive tests for new command structure
**Details**:
- Create new test file (copy and refactor from start.test.ts if exists)
- Test: successful VSCode launch with valid workspace and context
- Test: error when workspace not found
- Test: error when context not found (list available contexts)
- Test: error when workspace has no contexts
- Test: error when workspace file not found (launcher service error)
- Test: error when VSCode command fails (launcher service error)
- Test: missing workspace-name argument (oclif validation)
- Test: missing context-name argument (oclif validation)
- Mock workspace service and launcher service appropriately

**Validation**:
- All tests pass: `pnpm exec mocha --forbid-only "test/commands/workspace/vscode.test.ts"`
- Test coverage includes all success and error scenarios
- Tests use runCommand() from @oclif/test

**Dependencies**: Task 3 (command implementation complete)

---

### 5. Remove old start command file
**File**: `src/commands/workspace/start.ts`
**Description**: Delete the old command file
**Details**:
- Delete `src/commands/workspace/start.ts`
- This is a breaking change as documented in proposal

**Validation**:
- File no longer exists
- Build succeeds without errors
- No import errors from other files

**Dependencies**: Task 4 (new command fully tested)

---

### 6. Remove old start command tests
**File**: `test/commands/workspace/start.test.ts`
**Description**: Delete old test file if it exists
**Details**:
- Check if `test/commands/workspace/start.test.ts` exists
- Delete the file if present
- Remove any test fixtures specific to start command

**Validation**:
- Old test file removed
- All remaining tests pass: `pnpm test`

**Dependencies**: Task 5 (old command removed)

---

### 7. Build and verify compilation
**Description**: Ensure project builds successfully
**Details**:
- Run `pnpm run build`
- Verify no TypeScript compilation errors
- Verify dist/ contains new vscode command
- Verify dist/ does not contain old start command

**Validation**:
- Build succeeds with exit code 0
- `dist/commands/workspace/vscode.js` exists
- `dist/commands/workspace/start.js` does not exist

**Dependencies**: Task 6 (all code changes complete)

---

### 8. Run full test suite
**Description**: Verify all tests pass after refactoring
**Details**:
- Run `pnpm test`
- Verify no test failures
- Verify no linting errors
- Ensure no existing workspace list tests are broken

**Validation**:
- All tests pass
- Linting passes
- No regressions in other commands

**Dependencies**: Task 7 (build succeeds)

---

### 9. Manual integration test
**Description**: Test command with real PocketBase data
**Details**:
- Ensure PocketBase is running with test workspace data
- Test: `./bin/dev.js workspace vscode <real-workspace> <real-context>`
- Verify VSCode launches with correct workspace file
- Test: `./bin/dev.js workspace vscode invalid-workspace context`
- Verify appropriate error message
- Test: `./bin/dev.js workspace vscode <real-workspace> invalid-context`
- Verify context not found error with context list

**Validation**:
- Command launches VSCode successfully with valid inputs
- Error messages match spec requirements
- Help text displays correctly

**Dependencies**: Task 8 (all tests pass)

---

### 10. Update README
**Description**: Regenerate README with new command documentation
**Details**:
- Run `pnpm run prepack` to regenerate README
- Verify new command appears in command list
- Verify old `workspace start` command is removed
- Verify examples are accurate

**Validation**:
- README.md contains `workspace vscode` command
- README.md does not contain `workspace start` command
- Generated documentation is accurate

**Dependencies**: Task 9 (manual testing complete)

---

## Task Sequencing

**Sequential Tasks** (must run in order):
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

**Parallelizable Tasks**: None (all tasks have dependencies)

## Estimated Effort

- **Total Tasks**: 10
- **Complexity**: Medium
- **Estimated Time**: 2-3 hours
- **Breaking Change**: Yes (requires migration from users)

## Rollback Plan

If issues are discovered after implementation:
1. Restore `src/commands/workspace/start.ts` from git
2. Restore `test/commands/workspace/start.test.ts` from git
3. Delete `src/commands/workspace/vscode.ts`
4. Delete `test/commands/workspace/vscode.test.ts`
5. Run build and tests to verify rollback
6. Regenerate README

## Success Metrics

- [x] All 10 tasks completed
- [x] All tests passing (98 passing, 3 pending)
- [x] Build succeeds
- [ ] Manual integration test successful (requires PocketBase setup)
- [ ] README updated (requires manual run of prepack)
- [x] No regressions in other commands
