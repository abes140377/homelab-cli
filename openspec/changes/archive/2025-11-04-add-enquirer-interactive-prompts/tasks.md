# Tasks: add-enquirer-interactive-prompts

## Overview

This document outlines the implementation tasks for integrating enquirer and creating interactive prompt utilities. Tasks are ordered to deliver incremental, testable progress.

## Task List

### 1. Install enquirer dependency

**Description**: Add enquirer npm package as a production dependency

**Validation**:
- [x] enquirer appears in package.json dependencies (not devDependencies)
- [x] pnpm-lock.yaml is updated
- [x] `pnpm install` completes successfully
- [x] No security vulnerabilities reported

**Dependencies**: None

**Commands**:
```bash
pnpm add enquirer
```

### 2. Create TypeScript type definitions

**Description**: Create type definitions for prompt configuration and utilities

**Files**:
- `src/utils/prompts.types.ts`

**Validation**:
- [x] `PromptOptions<T>` interface defined with message, initial, validate, skip
- [x] `SelectionOptions<T>` interface extends PromptOptions with choices array
- [x] All interfaces exported
- [x] TypeScript compilation succeeds

**Dependencies**: Task 1

**Details**:
- Define generic interfaces for type safety
- Include JSDoc comments
- Make all properties except `message` optional

### 3. Implement promptForText utility

**Description**: Create text input prompt utility function

**Files**:
- `src/utils/prompts.ts` (new)

**Validation**:
- [x] Function signature: `promptForText(options: PromptOptions<string>): Promise<Result<string>>`
- [x] Wraps enquirer's Input prompt
- [x] Returns Result<string> on success
- [x] Returns error Result on cancellation/failure
- [x] Supports default values via `initial` option
- [x] Supports validation via `validate` option
- [x] TypeScript compilation succeeds

**Dependencies**: Task 2

**Details**:
- Import enquirer Input prompt
- Wrap in try-catch for error handling
- Map enquirer result to Result<T> type
- Handle user cancellation (Ctrl+C)

### 4. Implement promptForPassword utility

**Description**: Create password input prompt utility function

**Files**:
- `src/utils/prompts.ts` (edit)

**Validation**:
- [x] Function signature: `promptForPassword(options: PromptOptions<string>): Promise<Result<string>>`
- [x] Wraps enquirer's Password prompt
- [x] Returns Result<string> on success
- [x] Masks input characters
- [x] Supports default values
- [x] TypeScript compilation succeeds

**Dependencies**: Task 3

**Details**:
- Similar structure to promptForText
- Uses Password prompt type from enquirer

### 5. Implement promptForSelection utility

**Description**: Create single selection prompt utility function

**Files**:
- `src/utils/prompts.ts` (edit)

**Validation**:
- [x] Function signature: `promptForSelection<T>(options: SelectionOptions<T>): Promise<Result<T>>`
- [x] Wraps enquirer's Select prompt
- [x] Returns Result<T> on success
- [x] Supports generic types
- [x] Supports default selection via `initial`
- [x] TypeScript compilation succeeds with type inference

**Dependencies**: Task 4

**Details**:
- Use generic type parameter for type safety
- Map choices array to enquirer format
- Handle initial value mapping

### 6. Implement promptForMultipleSelections utility

**Description**: Create multiple selection prompt utility function

**Files**:
- `src/utils/prompts.ts` (edit)

**Validation**:
- [x] Function signature: `promptForMultipleSelections<T>(options: SelectionOptions<T[]>): Promise<Result<T[]>>`
- [x] Wraps enquirer's MultiSelect prompt
- [x] Returns Result<T[]> on success
- [x] Supports default selections via `initial` array
- [x] Handles empty selection (returns empty array)
- [x] TypeScript compilation succeeds

**Dependencies**: Task 5

**Details**:
- Returns array of selected values
- Map initial array to enquirer format

### 7. Add JSDoc documentation

**Description**: Add comprehensive JSDoc comments to all prompt functions

**Files**:
- `src/utils/prompts.ts` (edit)
- `src/utils/prompts.types.ts` (edit)

**Validation**:
- [x] Every exported function has JSDoc with @description, @param, @returns, @example
- [x] Every interface has JSDoc with property descriptions
- [x] Examples show common usage patterns
- [x] TypeScript compiles and generates declaration files

**Dependencies**: Task 6

**Details**:
- Include usage examples in JSDoc
- Document error conditions
- Show type inference examples

### 8. Create unit tests for text prompt

**Description**: Write unit tests for promptForText function

**Files**:
- `test/utils/prompts.test.ts` (new)

**Validation**:
- [x] Test successful text input
- [x] Test with default value
- [x] Test with validation function
- [x] Test user cancellation
- [x] Test skip functionality
- [x] All tests pass: `pnpm test test/utils/prompts.test.ts`

**Dependencies**: Task 3, Task 7

**Details**:
- Use Mocha + Chai
- Mock enquirer for isolation
- Test Result pattern (success/failure cases)

### 9. Create unit tests for password prompt

**Description**: Write unit tests for promptForPassword function

**Files**:
- `test/utils/prompts.test.ts` (edit)

**Validation**:
- [x] Test successful password input
- [x] Test with default value
- [x] Test user cancellation
- [x] All tests pass

**Dependencies**: Task 4, Task 8

**Details**:
- Similar structure to text prompt tests
- Verify masking behavior (if testable)

### 10. Create unit tests for selection prompts

**Description**: Write unit tests for promptForSelection and promptForMultipleSelections

**Files**:
- `test/utils/prompts.test.ts` (edit)

**Validation**:
- [x] Test single selection with string choices
- [x] Test single selection with generic types
- [x] Test single selection with default
- [x] Test multiple selections
- [x] Test multiple selections with defaults
- [x] Test multiple selections with empty result
- [x] Test user cancellation for both
- [x] All tests pass

**Dependencies**: Task 5, Task 6, Task 9

**Details**:
- Test type inference
- Test array handling for multi-select

### 11. Create demo command structure

**Description**: Create the `homelab prompt demo` command skeleton

**Files**:
- `src/commands/prompt/demo.ts` (new)

**Validation**:
- [x] Command extends BaseCommand
- [x] Static description property defined
- [x] Static examples property with usage examples
- [x] async run() method defined
- [x] Command compiles: `pnpm run build`
- [x] Command appears in help: `./bin/dev.js prompt --help`

**Dependencies**: Task 1

**Details**:
- Follow oclif command structure
- Use BaseCommand as parent class
- Add descriptive help text

### 12. Implement text input prompt in demo command

**Description**: Add name prompt to demo command

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [x] Calls promptForText with message "What is your name?"
- [x] Sets default value to "Guest"
- [x] Handles Result error case
- [x] Stores result for summary display
- [x] Command runs: `./bin/dev.js prompt demo`

**Dependencies**: Task 3, Task 11

**Details**:
- Import promptForText from utils
- Check Result.success before accessing data
- Exit with error if prompt fails

### 13. Implement password prompt in demo command

**Description**: Add password prompt to demo command

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [x] Calls promptForPassword with message "Enter your password:"
- [x] Executes after name prompt
- [x] Handles Result error case
- [x] Stores password for summary (masked)
- [x] Command runs successfully

**Dependencies**: Task 4, Task 12

**Details**:
- Execute sequentially after text prompt
- Mask password in output

### 14. Implement selection prompts in demo command

**Description**: Add single and multiple selection prompts to demo command

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [x] Single select with choices: "option 1", "option 2", "option 3"
- [x] Multi-select with choices: "option A", "option B", "option C"
- [x] Both execute sequentially
- [x] Handles Result error cases
- [x] Stores results for summary
- [x] Command runs through all prompts

**Dependencies**: Task 5, Task 6, Task 13

**Details**:
- Execute sequentially after password prompt
- Handle empty multi-select result

### 15. Implement summary output in demo command

**Description**: Format and display collected prompt results

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [x] Displays "Demo Results:" header
- [x] Shows name, password (masked), selected option, multi-select options
- [x] Handles empty multi-select (displays "None")
- [x] Output is clear and formatted
- [x] Command completes successfully

**Dependencies**: Task 14

**Details**:
- Use this.log() for output
- Format as key-value pairs
- Mask password with asterisks
- Handle edge cases (empty arrays)

### 16. Add error handling for JSON mode

**Description**: Detect and fail when --json flag is used with prompts

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [x] Checks for --json flag at command start
- [x] Displays error: "Interactive prompts are not compatible with --json output mode"
- [x] Exits with code 1
- [x] Test: `./bin/dev.js prompt demo --json` shows error

**Dependencies**: Task 15

**Details**:
- Check this.flags.json in run() method
- Call this.error() to exit gracefully

### 17. Add TTY detection

**Description**: Detect non-interactive environments and show helpful error

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [x] Checks process.stdin.isTTY
- [x] Shows error if not TTY: "This command requires an interactive terminal"
- [x] Exits with code 1
- [x] Can be tested in non-TTY environment

**Dependencies**: Task 16

**Details**:
- Check at start of run() method
- Provide clear error message for CI/CD scenarios

### 18. Create integration tests for demo command

**Description**: Write integration tests for the demo command

**Files**:
- `test/commands/prompt/demo.test.ts` (new)

**Validation**:
- [x] Uses `runCommand` from `@oclif/test`
- [x] Mocks prompt utilities (not enquirer directly)
- [x] Tests successful execution path
- [x] Tests error handling
- [x] Tests JSON mode error
- [x] All tests pass: `pnpm test test/commands/prompt/demo.test.ts`

**Dependencies**: Task 17

**Details**:
- Mock at the utils/prompts level
- Use Sinon for mocking
- Verify output formatting

### 19. Run full test suite

**Description**: Execute all tests and verify passing

**Commands**:
```bash
pnpm test
```

**Validation**:
- [x] All tests pass (utils + commands)
- [x] No test is marked with `.only()`
- [x] Code coverage is reasonable (aim for >80% on new code)
- [x] No linting errors: `pnpm run lint`

**Dependencies**: Task 18

**Details**:
- Fix any failing tests
- Address linting issues

### 20. Build and verify command availability

**Description**: Build the project and verify command is available

**Commands**:
```bash
pnpm run build
./bin/run.js prompt demo
```

**Validation**:
- [x] Build completes without errors
- [x] Command appears in `./bin/run.js --help`
- [x] Command runs from compiled dist/
- [x] All prompts work in production build

**Dependencies**: Task 19

**Details**:
- Test compiled version, not dev version
- Verify ESM imports work correctly

### 21. Update README

**Description**: Regenerate README with new command documentation

**Commands**:
```bash
pnpm run prepack
```

**Validation**:
- [x] README.md includes `prompt demo` command
- [x] Command description appears
- [x] Usage examples are shown
- [x] No git changes outside README and manifest

**Dependencies**: Task 20

**Details**:
- oclif automatically generates command documentation
- Verify generated content is correct

### 22. Validate with OpenSpec

**Description**: Run OpenSpec validation to ensure proposal compliance

**Commands**:
```bash
openspec validate add-enquirer-interactive-prompts --strict
```

**Validation**:
- [x] Validation passes with no errors
- [x] All spec requirements are addressed
- [x] All tasks are marked complete

**Dependencies**: Task 21

**Details**:
- Fix any validation errors
- Update specs if requirements changed during implementation

## Parallel Work Opportunities

The following tasks can be worked on in parallel:

- **Group A** (Prompt utilities): Tasks 3-6 can be implemented in parallel after Task 2
- **Group B** (Unit tests): Tasks 8-10 can be written in parallel while utilities are being implemented
- **Group C** (Command implementation): Tasks 12-14 can be implemented in parallel after Task 11

## Rollback Plan

If issues arise during implementation:

1. **Before Task 11**: Remove enquirer dependency, delete prompt utilities
2. **After Task 11**: Keep utilities, remove demo command
3. **Production issues**: Demo command is isolated, can be removed without affecting other commands

## Success Criteria

All tasks completed AND:
- [x] `pnpm test` passes
- [x] `pnpm run lint` passes
- [x] `pnpm run build` succeeds
- [x] `openspec validate add-enquirer-interactive-prompts --strict` passes
- [x] `homelab prompt demo` runs successfully in interactive terminal
- [x] `homelab prompt demo --json` shows appropriate error
- [x] All four prompt types work correctly
- [x] Documentation is complete
