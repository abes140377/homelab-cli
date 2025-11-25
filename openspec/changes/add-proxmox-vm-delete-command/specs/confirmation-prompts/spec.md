# confirmation-prompts Specification

## ADDED Requirements

### Requirement: Confirmation Prompt Utility

The prompts library SHALL provide a reusable confirmation prompt for yes/no questions.

#### Scenario: Prompt for boolean confirmation

- **GIVEN** a confirmation is needed from the user
- **WHEN** `promptForConfirmation({message: "Are you sure?"})` is called
- **THEN** it SHALL display the message to the user
- **AND** present "Yes" and "No" options
- **AND** return Result<boolean, Error> with `data: true` if user selects Yes
- **AND** return Result<boolean, Error> with `data: false` if user selects No

#### Scenario: Confirmation with default value

- **GIVEN** a confirmation prompt with default value
- **WHEN** `promptForConfirmation({message: "Continue?", initial: false})` is called
- **THEN** it SHALL pre-select "No" as the default option
- **AND** allow user to change selection
- **AND** return the user's final choice

#### Scenario: Skip confirmation in automated contexts

- **GIVEN** a confirmation prompt with skip flag
- **WHEN** `promptForConfirmation({message: "Delete?", skip: true, initial: true})` is called
- **THEN** it SHALL NOT display the prompt to the user
- **AND** return Result with `data: true` (the initial value)
- **AND** complete immediately without user interaction

#### Scenario: Handle user cancellation

- **GIVEN** a confirmation prompt is displayed
- **WHEN** the user presses Ctrl+C or ESC to cancel
- **THEN** it SHALL return a failure Result
- **AND** the error message SHALL be "Prompt cancelled"
- **AND** allow the calling code to handle gracefully

### Requirement: Confirmation Prompt Options Interface

The prompts.types module SHALL define a type for confirmation prompt options.

#### Scenario: ConfirmationOptions type definition

- **GIVEN** the `src/utils/prompts.types.ts` file
- **THEN** it SHALL export interface `ConfirmationOptions`
- **AND** the interface SHALL extend `Omit<PromptOptions<boolean>, 'validate'>`
- **AND** the interface SHALL NOT include `validate` property (not applicable for boolean yes/no)
- **AND** the interface SHALL support `message`, `initial`, and `skip` properties

### Requirement: Confirmation Prompt Implementation

The confirmation prompt SHALL be implemented using Enquirer's confirm prompt type.

#### Scenario: Use Enquirer confirm prompt

- **GIVEN** the `promptForConfirmation` implementation
- **THEN** it SHALL use Enquirer.prompt with `type: 'confirm'`
- **AND** map the result to Result<boolean, Error>
- **AND** handle errors consistently with other prompt utilities

#### Scenario: Return type consistency

- **GIVEN** any prompt utility function
- **THEN** it SHALL return Promise<Result<T, Error>>
- **AND** follow the same error handling pattern as existing prompts
- **AND** support the same `skip` functionality as other prompts

### Requirement: Confirmation Prompt Testing

The confirmation prompt SHALL have comprehensive test coverage.

#### Scenario: Test confirmation acceptance

- **WHEN** tests are executed for promptForConfirmation
- **THEN** they SHALL verify returning true when user selects Yes
- **AND** verify returning false when user selects No
- **AND** verify default value pre-selection
- **AND** verify skip functionality
- **AND** verify error handling for cancellation

### Requirement: Confirmation Prompt Documentation

The confirmation prompt SHALL have clear documentation and examples.

#### Scenario: JSDoc documentation

- **GIVEN** the `promptForConfirmation` function
- **THEN** it SHALL include JSDoc comment explaining purpose
- **AND** include @param documentation for options
- **AND** include @returns documentation for Result type
- **AND** include @example showing typical usage

#### Scenario: Usage example in docs

- **GIVEN** the JSDoc @example
- **THEN** it SHALL show a complete usage example
- **AND** demonstrate handling both success and cancellation
- **AND** be syntactically correct TypeScript code

## MODIFIED Requirements

### Requirement: Interactive Prompts Library Exports

The prompts module SHALL export the confirmation prompt function alongside existing prompt functions.

#### Scenario: Export promptForConfirmation

- **GIVEN** the `src/utils/prompts.ts` file
- **THEN** it SHALL export function `promptForConfirmation`
- **AND** the function SHALL be available for import in commands
- **AND** maintain exports of existing functions: `promptForText`, `promptForPassword`, `promptForSelection`, `promptForMultipleSelections`
