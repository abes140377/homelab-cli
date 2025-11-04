# Spec: prompt-demo-command

**Status**: Draft
**Capability**: Prompt Demo Command
**Layer**: Command

## ADDED Requirements

### Requirement: Demo Command Registration

The system SHALL provide a `homelab prompt demo` command that demonstrates all interactive prompt types.

**Priority**: P0
**Type**: Functional

#### Scenario: Command is registered and discoverable

**Given** the homelab CLI is installed
**When** a user runs `homelab --help`
**Then** the system lists the `prompt` topic
**And** running `homelab prompt --help` shows the `demo` command

#### Scenario: Command help documentation

**Given** a user wants to learn about the demo command
**When** they run `homelab prompt demo --help`
**Then** the system displays command description
**And** shows usage examples
**And** lists any available flags

### Requirement: Text Input Demonstration

The system SHALL demonstrate text input prompts in the demo command.

**Priority**: P0
**Type**: Functional

#### Scenario: Prompt for user's name

**Given** a user runs `homelab prompt demo`
**When** the command executes
**Then** the system prompts "What is your name?"
**And** provides a default value of "Guest"
**And** waits for user input
**And** accepts and stores the user's response

#### Scenario: Display collected name

**Given** the user has entered their name
**When** all prompts complete
**Then** the system displays the collected name in the summary output

### Requirement: Password Input Demonstration

The system SHALL demonstrate password input prompts in the demo command.

**Priority**: P0
**Type**: Functional

#### Scenario: Prompt for password

**Given** the text input prompt has completed
**When** the command continues execution
**Then** the system prompts "Enter your password:"
**And** masks the password input as the user types
**And** accepts and stores the password

#### Scenario: Display masked password

**Given** the user has entered their password
**When** all prompts complete
**Then** the system displays the password as asterisks (e.g., "********")
**And** does NOT display the actual password in plain text

### Requirement: Single Selection Demonstration

The system SHALL demonstrate single selection prompts in the demo command.

**Priority**: P0
**Type**: Functional

#### Scenario: Prompt for single option

**Given** the password prompt has completed
**When** the command continues execution
**Then** the system prompts "Choose an option:"
**And** displays a list with three choices: "option 1", "option 2", "option 3"
**And** allows navigation with arrow keys
**And** allows selection with Enter key
**And** stores the selected option

#### Scenario: Display selected option

**Given** the user has selected an option
**When** all prompts complete
**Then** the system displays which option was selected in the summary

### Requirement: Multiple Selection Demonstration

The system SHALL demonstrate multiple selection prompts in the demo command.

**Priority**: P0
**Type**: Functional

#### Scenario: Prompt for multiple options

**Given** the single selection prompt has completed
**When** the command continues execution
**Then** the system prompts "Select multiple options:"
**And** displays a list with checkboxes for: "option A", "option B", "option C"
**And** allows toggling selections with Space key
**And** allows confirming with Enter key
**And** stores all selected options

#### Scenario: Display selected options

**Given** the user has selected zero or more options
**When** all prompts complete
**Then** the system displays all selected options in the summary
**Or** indicates "None" if no options were selected

### Requirement: Summary Output

The system SHALL display a formatted summary of all collected input after prompts complete.

**Priority**: P0
**Type**: Functional

#### Scenario: Display results summary

**Given** all prompts have completed successfully
**When** the command formats output
**Then** the system displays a clear header "Demo Results:"
**And** shows each collected value with a label:
  - "Name: {name}"
  - "Password: {masked}"
  - "Selected Option: {option}"
  - "Multi-Select: {comma-separated options or None}"

```
Demo Results:
=============
Name: Alice
Password: ********
Selected Option: option 2
Multi-Select: option A, option C
```

#### Scenario: Handle empty multi-select

**Given** the user did not select any options in the multi-select prompt
**When** the command displays the summary
**Then** the Multi-Select field shows "None"

### Requirement: Error Handling

The system SHALL handle prompt errors and user cancellation gracefully.

**Priority**: P0
**Type**: Functional

#### Scenario: User cancels during prompts

**Given** the demo command is executing prompts
**When** the user presses Ctrl+C to cancel
**Then** the system catches the cancellation
**And** displays an error message "Prompt cancelled by user"
**And** exits with a non-zero exit code

#### Scenario: Prompt error handling

**Given** a prompt function returns an error Result
**When** the command receives the error
**Then** the system displays the error message
**And** exits with exit code 1
**And** does NOT display partial results

### Requirement: Sequential Execution

The system SHALL execute all prompts in a defined sequence.

**Priority**: P0
**Type**: Functional

#### Scenario: Prompts execute in order

**Given** the demo command starts
**When** prompts are displayed
**Then** they appear in this order:
  1. Text input (name)
  2. Password input
  3. Single selection
  4. Multiple selection
**And** each prompt waits for the previous to complete
**And** the summary displays after all prompts finish

### Requirement: Command Architecture

The system SHALL implement the demo command using command-only architecture without service/repository layers.

**Priority**: P1
**Type**: Non-Functional

#### Scenario: Direct prompt utility usage

**Given** the demo command implementation
**When** the command needs to prompt for input
**Then** it directly imports and calls prompt utilities from `src/utils/prompts.ts`
**And** does NOT use intermediate service or repository layers
**And** handles Results directly in the command's run method

### Requirement: Examples and Documentation

The system SHALL provide command examples in help documentation.

**Priority**: P1
**Type**: Non-Functional

#### Scenario: Command examples in help

**Given** a user runs `homelab prompt demo --help`
**When** the help text displays
**Then** the system shows at least one usage example
**And** describes the purpose of the demo command
**And** mentions that it demonstrates interactive prompt capabilities

### Requirement: Testing

The system SHALL provide integration tests for the demo command.

**Priority**: P0
**Type**: Non-Functional

#### Scenario: Demo command integration test

**Given** integration tests for the demo command
**When** tests execute
**Then** they use `runCommand` from `@oclif/test`
**And** mock the prompt utilities (not enquirer directly)
**And** verify output formatting
**And** test error handling scenarios

#### Scenario: Test user cancellation

**Given** an integration test for the demo command
**When** the test simulates user cancellation
**Then** the test verifies the error message
**And** verifies the exit code is non-zero

### Requirement: Non-Interactive Environment Detection

The system SHALL detect non-interactive environments and provide helpful error messages.

**Priority**: P1
**Type**: Functional

#### Scenario: Detect non-TTY environment

**Given** the demo command runs in a non-interactive environment (e.g., piped input, CI/CD)
**When** the command attempts to show prompts
**Then** the system detects the lack of TTY
**And** displays an error: "This command requires an interactive terminal"
**And** exits with exit code 1

**Note**: This applies to all prompt usage, not just the demo command.

### Requirement: JSON Output Incompatibility

The system SHALL fail gracefully when prompts are used with JSON output mode.

**Priority**: P1
**Type**: Functional

#### Scenario: Error when using --json flag

**Given** commands support the global `--json` flag
**When** a user runs `homelab prompt demo --json`
**Then** the system detects the conflict
**And** displays an error: "Interactive prompts are not compatible with --json output mode"
**And** exits with exit code 1

**Note**: This should be enforced at the BaseCommand level for all commands using prompts.
