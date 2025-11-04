# interactive-prompts Specification

## Purpose
TBD - created by archiving change add-enquirer-interactive-prompts. Update Purpose after archive.
## Requirements
### Requirement: Text Input Prompts

The system SHALL provide a utility function for collecting text input from users through interactive prompts.

**Priority**: P0
**Type**: Functional

#### Scenario: Basic text input prompt

**Given** a command needs to collect text input from the user
**When** the command calls `promptForText()` with a message
**Then** the system displays an interactive prompt with the message
**And** waits for the user to enter text
**And** returns a success Result containing the entered text

```typescript
const result = await promptForText({
  message: 'What is your name?'
});
// User enters: 'Alice'
// result = { success: true, data: 'Alice' }
```

#### Scenario: Text input with default value

**Given** a command provides a default value for text input
**When** the command calls `promptForText()` with an initial value
**Then** the system displays the prompt with the default value pre-filled
**And** the user can accept the default by pressing Enter
**And** returns a success Result with the default value if no input provided

```typescript
const result = await promptForText({
  message: 'Enter username:',
  initial: 'admin'
});
// User presses Enter without typing
// result = { success: true, data: 'admin' }
```

#### Scenario: Text input with validation

**Given** a command requires validated text input
**When** the command calls `promptForText()` with a validation function
**And** the user enters invalid input
**Then** the system displays an error message inline
**And** re-prompts the user until valid input is provided
**And** returns a success Result with the valid input

```typescript
const result = await promptForText({
  message: 'Enter email:',
  validate: (value) => value.includes('@') || 'Must be a valid email'
});
// User enters: 'invalid'
// System shows: 'Must be a valid email'
// User enters: 'alice@example.com'
// result = { success: true, data: 'alice@example.com' }
```

### Requirement: Password Input Prompts

The system SHALL provide a utility function for collecting password input with masked display.

**Priority**: P0
**Type**: Functional

#### Scenario: Password input with masking

**Given** a command needs to collect sensitive password input
**When** the command calls `promptForPassword()` with a message
**Then** the system displays an interactive prompt with the message
**And** masks all characters as the user types
**And** returns a success Result containing the entered password

```typescript
const result = await promptForPassword({
  message: 'Enter your password:'
});
// User types: 'secret123' (displayed as '********')
// result = { success: true, data: 'secret123' }
```

#### Scenario: Password with default value

**Given** a command provides a default password value
**When** the command calls `promptForPassword()` with an initial value
**Then** the system displays the prompt with masked default indicator
**And** returns the default value if user presses Enter without typing

```typescript
const result = await promptForPassword({
  message: 'Enter password:',
  initial: 'default-password'
});
// Default is masked, user presses Enter
// result = { success: true, data: 'default-password' }
```

### Requirement: Single Selection Prompts

The system SHALL provide a utility function for selecting a single option from a list of choices.

**Priority**: P0
**Type**: Functional

#### Scenario: Select from string options

**Given** a command needs the user to choose one option from a list
**When** the command calls `promptForSelection()` with choices
**Then** the system displays an interactive list of options
**And** allows the user to navigate with arrow keys
**And** allows the user to select with Enter key
**And** returns a success Result with the selected value

```typescript
const result = await promptForSelection({
  message: 'Choose an option:',
  choices: ['option 1', 'option 2', 'option 3']
});
// User navigates to 'option 2' and presses Enter
// result = { success: true, data: 'option 2' }
```

#### Scenario: Select with default choice

**Given** a command provides a default selection
**When** the command calls `promptForSelection()` with an initial value
**Then** the system highlights the default option initially
**And** returns the default if user presses Enter immediately

```typescript
const result = await promptForSelection({
  message: 'Choose an option:',
  choices: ['option 1', 'option 2', 'option 3'],
  initial: 'option 2'
});
// 'option 2' is pre-selected, user presses Enter
// result = { success: true, data: 'option 2' }
```

#### Scenario: Select with generic types

**Given** a command needs to select from non-string options
**When** the command calls `promptForSelection()` with typed choices
**Then** the system preserves the type of the selected value
**And** returns a strongly-typed Result

```typescript
const result = await promptForSelection<number>({
  message: 'Choose a port:',
  choices: [8080, 8443, 3000]
});
// result has type Result<number>
// result = { success: true, data: 8443 }
```

### Requirement: Multiple Selection Prompts

The system SHALL provide a utility function for selecting multiple options from a list of choices.

**Priority**: P0
**Type**: Functional

#### Scenario: Multi-select from options

**Given** a command needs the user to choose multiple options
**When** the command calls `promptForMultipleSelections()` with choices
**Then** the system displays an interactive list with checkboxes
**And** allows toggling selections with Space key
**And** allows confirming selections with Enter key
**And** returns a success Result with an array of selected values

```typescript
const result = await promptForMultipleSelections({
  message: 'Select multiple options:',
  choices: ['option A', 'option B', 'option C']
});
// User selects 'option A' and 'option C'
// result = { success: true, data: ['option A', 'option C'] }
```

#### Scenario: Multi-select with default selections

**Given** a command provides default selections
**When** the command calls `promptForMultipleSelections()` with initial values
**Then** the system pre-checks the default options
**And** returns the defaults if user presses Enter immediately

```typescript
const result = await promptForMultipleSelections({
  message: 'Select options:',
  choices: ['option A', 'option B', 'option C'],
  initial: ['option A', 'option B']
});
// 'option A' and 'option B' are pre-checked
// result = { success: true, data: ['option A', 'option B'] }
```

#### Scenario: Multi-select with empty selection

**Given** a user is selecting multiple options
**When** the user deselects all options and presses Enter
**Then** the system returns a success Result with an empty array

```typescript
const result = await promptForMultipleSelections({
  message: 'Select options:',
  choices: ['option A', 'option B', 'option C']
});
// User selects nothing and presses Enter
// result = { success: true, data: [] }
```

### Requirement: User Cancellation Handling

The system SHALL handle user cancellation gracefully and return error Results.

**Priority**: P0
**Type**: Functional

#### Scenario: User cancels with Ctrl+C

**Given** a prompt is displayed to the user
**When** the user presses Ctrl+C to cancel
**Then** the system catches the cancellation
**And** returns an error Result with a descriptive message

```typescript
const result = await promptForText({
  message: 'Enter name:'
});
// User presses Ctrl+C
// result = { success: false, error: Error('User cancelled prompt') }
```

#### Scenario: User cancels with Escape

**Given** a selection prompt is displayed
**When** the user presses Escape to cancel
**Then** the system catches the cancellation
**And** returns an error Result

```typescript
const result = await promptForSelection({
  message: 'Choose option:',
  choices: ['A', 'B', 'C']
});
// User presses Escape
// result = { success: false, error: Error('User cancelled prompt') }
```

### Requirement: Skip Prompt Support

The system SHALL support skipping prompts conditionally based on configuration.

**Priority**: P1
**Type**: Functional

#### Scenario: Skip prompt when condition is met

**Given** a command wants to conditionally skip a prompt
**When** the command calls a prompt function with `skip: true`
**Then** the prompt is not displayed to the user
**And** the system returns the default value if provided
**Or** returns an error Result if no default is provided

```typescript
const hasName = true;
const result = await promptForText({
  message: 'Enter name:',
  initial: 'Alice',
  skip: hasName
});
// Prompt is not shown
// result = { success: true, data: 'Alice' }
```

### Requirement: Result Pattern Consistency

The system SHALL return all prompt results using the Result<T> pattern for consistent error handling.

**Priority**: P0
**Type**: Functional

#### Scenario: Successful prompt returns success Result

**Given** any prompt function is called
**When** the user successfully completes the prompt
**Then** the system returns a Result with `success: true`
**And** the `data` field contains the user's input

#### Scenario: Failed or cancelled prompt returns error Result

**Given** any prompt function is called
**When** the prompt fails or is cancelled
**Then** the system returns a Result with `success: false`
**And** the `error` field contains a descriptive Error object

### Requirement: Type Safety

The system SHALL provide full TypeScript type safety for all prompt functions.

**Priority**: P0
**Type**: Non-Functional

#### Scenario: Generic type preservation

**Given** a prompt function is called with typed choices
**When** the function returns a Result
**Then** the Result data type matches the choice type
**And** TypeScript provides compile-time type checking

```typescript
// Type is inferred as Result<number>
const result = await promptForSelection<number>({
  message: 'Choose port:',
  choices: [8080, 8443]
});

if (result.success) {
  // TypeScript knows result.data is number
  const port: number = result.data;
}
```

#### Scenario: Configuration object type checking

**Given** a developer calls a prompt function
**When** they provide a configuration object
**Then** TypeScript validates all properties at compile time
**And** provides autocomplete for available options

### Requirement: Testability

The system SHALL enable full unit testing of prompt functions without user interaction.

**Priority**: P0
**Type**: Non-Functional

#### Scenario: Dependency injection for testing

**Given** a test needs to verify prompt behavior
**When** the test injects a mock enquirer instance
**Then** the prompt functions use the mock instead of the real library
**And** the test can verify behavior without user interaction

```typescript
// Test code
const mockEnquirer = {
  prompt: async () => ({ name: 'mocked-value' })
};
const testPrompt = createPromptForText(mockEnquirer);
const result = await testPrompt({ message: 'Test' });
// result = { success: true, data: 'mocked-value' }
```

### Requirement: Documentation

The system SHALL provide comprehensive documentation for all prompt functions.

**Priority**: P1
**Type**: Non-Functional

#### Scenario: JSDoc comments for all functions

**Given** a developer uses a prompt function
**When** they view the function in their IDE
**Then** they see JSDoc comments with descriptions, parameters, return types, and examples

#### Scenario: Usage examples in documentation

**Given** a developer reads the prompt utilities documentation
**When** they review usage examples
**Then** they see examples for all prompt types
**And** examples show common patterns (defaults, validation, type safety)
