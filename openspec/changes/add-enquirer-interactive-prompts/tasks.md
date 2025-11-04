# Tasks: add-enquirer-interactive-prompts

## Overview

This document outlines the implementation tasks for integrating enquirer and creating interactive prompt utilities. Tasks are ordered to deliver incremental, testable progress.

## Task List

### 1. Install enquirer dependency

**Description**: Add enquirer npm package as a production dependency

**Validation**:
- [ ] enquirer appears in package.json dependencies (not devDependencies)
- [ ] pnpm-lock.yaml is updated
- [ ] `pnpm install` completes successfully
- [ ] No security vulnerabilities reported

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
- [ ] `PromptOptions<T>` interface defined with message, initial, validate, skip
- [ ] `SelectionOptions<T>` interface extends PromptOptions with choices array
- [ ] All interfaces exported
- [ ] TypeScript compilation succeeds

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
- [ ] Function signature: `promptForText(options: PromptOptions<string>): Promise<Result<string>>`
- [ ] Wraps enquirer's Input prompt
- [ ] Returns Result<string> on success
- [ ] Returns error Result on cancellation/failure
- [ ] Supports default values via `initial` option
- [ ] Supports validation via `validate` option
- [ ] TypeScript compilation succeeds

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
- [ ] Function signature: `promptForPassword(options: PromptOptions<string>): Promise<Result<string>>`
- [ ] Wraps enquirer's Password prompt
- [ ] Returns Result<string> on success
- [ ] Masks input characters
- [ ] Supports default values
- [ ] TypeScript compilation succeeds

**Dependencies**: Task 3

**Details**:
- Similar structure to promptForText
- Uses Password prompt type from enquirer

### 5. Implement promptForSelection utility

**Description**: Create single selection prompt utility function

**Files**:
- `src/utils/prompts.ts` (edit)

**Validation**:
- [ ] Function signature: `promptForSelection<T>(options: SelectionOptions<T>): Promise<Result<T>>`
- [ ] Wraps enquirer's Select prompt
- [ ] Returns Result<T> on success
- [ ] Supports generic types
- [ ] Supports default selection via `initial`
- [ ] TypeScript compilation succeeds with type inference

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
- [ ] Function signature: `promptForMultipleSelections<T>(options: SelectionOptions<T[]>): Promise<Result<T[]>>`
- [ ] Wraps enquirer's MultiSelect prompt
- [ ] Returns Result<T[]> on success
- [ ] Supports default selections via `initial` array
- [ ] Handles empty selection (returns empty array)
- [ ] TypeScript compilation succeeds

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
- [ ] Every exported function has JSDoc with @description, @param, @returns, @example
- [ ] Every interface has JSDoc with property descriptions
- [ ] Examples show common usage patterns
- [ ] TypeScript compiles and generates declaration files

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
- [ ] Test successful text input
- [ ] Test with default value
- [ ] Test with validation function
- [ ] Test user cancellation
- [ ] Test skip functionality
- [ ] All tests pass: `pnpm test test/utils/prompts.test.ts`

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
- [ ] Test successful password input
- [ ] Test with default value
- [ ] Test user cancellation
- [ ] All tests pass

**Dependencies**: Task 4, Task 8

**Details**:
- Similar structure to text prompt tests
- Verify masking behavior (if testable)

### 10. Create unit tests for selection prompts

**Description**: Write unit tests for promptForSelection and promptForMultipleSelections

**Files**:
- `test/utils/prompts.test.ts` (edit)

**Validation**:
- [ ] Test single selection with string choices
- [ ] Test single selection with generic types
- [ ] Test single selection with default
- [ ] Test multiple selections
- [ ] Test multiple selections with defaults
- [ ] Test multiple selections with empty result
- [ ] Test user cancellation for both
- [ ] All tests pass

**Dependencies**: Task 5, Task 6, Task 9

**Details**:
- Test type inference
- Test array handling for multi-select

### 11. Create demo command structure

**Description**: Create the `homelab prompt demo` command skeleton

**Files**:
- `src/commands/prompt/demo.ts` (new)

**Validation**:
- [ ] Command extends BaseCommand
- [ ] Static description property defined
- [ ] Static examples property with usage examples
- [ ] async run() method defined
- [ ] Command compiles: `pnpm run build`
- [ ] Command appears in help: `./bin/dev.js prompt --help`

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
- [ ] Calls promptForText with message "What is your name?"
- [ ] Sets default value to "Guest"
- [ ] Handles Result error case
- [ ] Stores result for summary display
- [ ] Command runs: `./bin/dev.js prompt demo`

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
- [ ] Calls promptForPassword with message "Enter your password:"
- [ ] Executes after name prompt
- [ ] Handles Result error case
- [ ] Stores password for summary (masked)
- [ ] Command runs successfully

**Dependencies**: Task 4, Task 12

**Details**:
- Execute sequentially after text prompt
- Mask password in output

### 14. Implement selection prompts in demo command

**Description**: Add single and multiple selection prompts to demo command

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [ ] Single select with choices: "option 1", "option 2", "option 3"
- [ ] Multi-select with choices: "option A", "option B", "option C"
- [ ] Both execute sequentially
- [ ] Handles Result error cases
- [ ] Stores results for summary
- [ ] Command runs through all prompts

**Dependencies**: Task 5, Task 6, Task 13

**Details**:
- Execute sequentially after password prompt
- Handle empty multi-select result

### 15. Implement summary output in demo command

**Description**: Format and display collected prompt results

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [ ] Displays "Demo Results:" header
- [ ] Shows name, password (masked), selected option, multi-select options
- [ ] Handles empty multi-select (displays "None")
- [ ] Output is clear and formatted
- [ ] Command completes successfully

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
- [ ] Checks for --json flag at command start
- [ ] Displays error: "Interactive prompts are not compatible with --json output mode"
- [ ] Exits with code 1
- [ ] Test: `./bin/dev.js prompt demo --json` shows error

**Dependencies**: Task 15

**Details**:
- Check this.flags.json in run() method
- Call this.error() to exit gracefully

### 17. Add TTY detection

**Description**: Detect non-interactive environments and show helpful error

**Files**:
- `src/commands/prompt/demo.ts` (edit)

**Validation**:
- [ ] Checks process.stdin.isTTY
- [ ] Shows error if not TTY: "This command requires an interactive terminal"
- [ ] Exits with code 1
- [ ] Can be tested in non-TTY environment

**Dependencies**: Task 16

**Details**:
- Check at start of run() method
- Provide clear error message for CI/CD scenarios

### 18. Create integration tests for demo command

**Description**: Write integration tests for the demo command

**Files**:
- `test/commands/prompt/demo.test.ts` (new)

**Validation**:
- [ ] Uses `runCommand` from `@oclif/test`
- [ ] Mocks prompt utilities (not enquirer directly)
- [ ] Tests successful execution path
- [ ] Tests error handling
- [ ] Tests JSON mode error
- [ ] All tests pass: `pnpm test test/commands/prompt/demo.test.ts`

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
- [ ] All tests pass (utils + commands)
- [ ] No test is marked with `.only()`
- [ ] Code coverage is reasonable (aim for >80% on new code)
- [ ] No linting errors: `pnpm run lint`

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
- [ ] Build completes without errors
- [ ] Command appears in `./bin/run.js --help`
- [ ] Command runs from compiled dist/
- [ ] All prompts work in production build

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
- [ ] README.md includes `prompt demo` command
- [ ] Command description appears
- [ ] Usage examples are shown
- [ ] No git changes outside README and manifest

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
- [ ] Validation passes with no errors
- [ ] All spec requirements are addressed
- [ ] All tasks are marked complete

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
- [ ] `pnpm test` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run build` succeeds
- [ ] `openspec validate add-enquirer-interactive-prompts --strict` passes
- [ ] `homelab prompt demo` runs successfully in interactive terminal
- [ ] `homelab prompt demo --json` shows appropriate error
- [ ] All four prompt types work correctly
- [ ] Documentation is complete
