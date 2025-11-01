# workspace-vscode Specification

## Purpose
Defines the simplified VSCode workspace launcher command that replaces the dual-purpose workspace start command, focusing solely on launching VSCode with workspace contexts.

## Requirements

### Requirement: VSCode Workspace Launch Command

The system SHALL provide a `homelab workspace vscode <workspace-name> <context-name>` command that launches VSCode with a specific workspace context.

#### Scenario: Successfully launch VSCode with valid workspace and context

- **WHEN** user executes `homelab workspace vscode <workspace-name> <context-name>`
- **AND** workspace with matching name exists in PocketBase
- **AND** context with matching name exists for that workspace
- **AND** workspace file exists at `~/projects/<workspace-name>/<context-name>.code-workspace`
- **THEN** the system SHALL execute `code "~/projects/<workspace-name>/<context-name>.code-workspace"`
- **AND** display success message "Opened workspace '<workspace-name>' with context '<context-name>' in VSCode"
- **AND** exit with status code 0

#### Scenario: Workspace not found

- **WHEN** user executes `homelab workspace vscode <workspace-name> <context-name>`
- **AND** no workspace with matching name exists in PocketBase
- **THEN** the system SHALL display error "Workspace '<workspace-name>' not found. Run 'homelab workspace list' to see available workspaces."
- **AND** exit with non-zero status code

#### Scenario: Context not found for workspace

- **WHEN** user executes `homelab workspace vscode <workspace-name> <context-name>`
- **AND** workspace exists in PocketBase
- **AND** specified context does not exist for that workspace
- **THEN** the system SHALL display error "Context '<context-name>' not found for workspace '<workspace-name>'. Available contexts: <context-list>"
- **AND** list all available context names separated by commas
- **AND** exit with non-zero status code

#### Scenario: Workspace has no contexts configured

- **WHEN** user executes `homelab workspace vscode <workspace-name> <context-name>`
- **AND** workspace exists but has no contexts configured
- **THEN** the system SHALL display error "No contexts found for workspace '<workspace-name>'. Please configure contexts in PocketBase."
- **AND** exit with non-zero status code

#### Scenario: Workspace file does not exist on filesystem

- **WHEN** user executes `homelab workspace vscode <workspace-name> <context-name>`
- **AND** workspace and context exist in PocketBase
- **AND** workspace file does not exist at `~/projects/<workspace-name>/<context-name>.code-workspace`
- **THEN** the system SHALL display error "Workspace file not found: ~/projects/<workspace-name>/<context-name>.code-workspace"
- **AND** exit with non-zero status code

#### Scenario: VSCode command execution fails

- **WHEN** user executes `homelab workspace vscode <workspace-name> <context-name>`
- **AND** workspace file exists
- **AND** `code` command execution fails (e.g., VSCode not installed)
- **THEN** the system SHALL display error "Failed to launch VSCode: <error-message>"
- **AND** exit with non-zero status code

### Requirement: Command Argument Structure

The VSCode workspace command SHALL accept two required positional string arguments.

#### Scenario: Both arguments provided

- **WHEN** user provides both workspace-name and context-name arguments
- **THEN** the command SHALL parse both arguments successfully
- **AND** proceed with workspace validation

#### Scenario: Missing workspace-name argument

- **WHEN** user executes `homelab workspace vscode` without arguments
- **THEN** oclif SHALL display usage error indicating workspace-name is required
- **AND** show command help
- **AND** exit with non-zero status code

#### Scenario: Missing context-name argument

- **WHEN** user executes `homelab workspace vscode <workspace-name>` without context-name
- **THEN** oclif SHALL display usage error indicating context-name is required
- **AND** show command help
- **AND** exit with non-zero status code

### Requirement: Workspace and Context Validation

The command SHALL validate workspace and context exist in PocketBase before attempting to launch VSCode.

#### Scenario: Load workspace with contexts from PocketBase

- **WHEN** command executes workspace lookup
- **THEN** it SHALL call workspace service findWorkspaceByName method
- **AND** retrieve workspace with expanded contexts relation
- **AND** validate returned workspace data using WorkspaceDTO schema

#### Scenario: Validate context exists in workspace

- **WHEN** workspace is successfully loaded from PocketBase
- **AND** workspace has contexts array
- **THEN** command SHALL search contexts array for matching context name
- **AND** use case-sensitive string comparison

#### Scenario: Handle workspace service errors

- **WHEN** workspace service returns failure Result
- **THEN** command SHALL extract error message from Result
- **AND** display user-friendly error message
- **AND** exit with non-zero status code

### Requirement: VSCode Launcher Integration

The command SHALL use WorkspaceLauncherService to execute VSCode launch.

#### Scenario: Delegate to launcher service

- **WHEN** workspace and context validation passes
- **THEN** command SHALL create WorkspaceLauncherService instance
- **AND** call launchVSCode(workspaceName, contextName) method
- **AND** handle returned Result type

#### Scenario: Handle launcher service success

- **WHEN** launcher service returns success Result
- **THEN** command SHALL display success message with workspace and context names
- **AND** exit normally with status code 0

#### Scenario: Handle launcher service failure

- **WHEN** launcher service returns failure Result
- **THEN** command SHALL extract error message from Result
- **AND** display error with prefix "Failed to launch VSCode: "
- **AND** exit with non-zero status code

### Requirement: Command Documentation

The command SHALL provide clear documentation and examples.

#### Scenario: Command description

- **WHEN** user requests help for workspace vscode command
- **THEN** description SHALL state "Open a workspace context in VSCode"

#### Scenario: Command examples

- **WHEN** user views command help
- **THEN** examples SHALL include:
  - Basic usage: `homelab workspace vscode my-project backend`
  - Another context: `homelab workspace vscode my-project frontend`

#### Scenario: Argument descriptions

- **WHEN** user views command help
- **THEN** workspace-name argument SHALL describe "Name of the workspace"
- **AND** context-name argument SHALL describe "Name of the context to open in VSCode"

## REMOVED Requirements

### Requirement: Terminal launch support (REMOVED)

The terminal launch functionality is removed from the workspace command and will be implemented as a separate command in the future.

#### Scenario: Terminal support removed

- **WHEN** this change is implemented
- **THEN** no `--terminal` flag SHALL exist
- **AND** no calls to `openTerminal()` service method SHALL exist
- **AND** no terminal-related validation or error handling SHALL exist

### Requirement: Flag-based mode selection (REMOVED)

The flag-based mode selection between VSCode and terminal is removed as the command now has a single purpose.

#### Scenario: Mode flags removed

- **WHEN** this change is implemented
- **THEN** no `--vscode` flag SHALL exist (implicit from command name)
- **AND** no `--terminal` flag SHALL exist
- **AND** no mutually exclusive flag validation SHALL exist
- **AND** no "require one flag" validation SHALL exist

### Requirement: Auto-context selection (REMOVED)

The automatic context selection for workspaces with a single context is removed in favor of explicit context specification.

#### Scenario: Auto-selection removed

- **WHEN** user executes the vscode command
- **THEN** context SHALL always be required as positional argument
- **AND** no automatic selection of single context SHALL occur
- **AND** no conditional context requirement logic SHALL exist

### Requirement: Context as optional flag (REMOVED)

The `--context` flag is removed and replaced with a required positional argument.

#### Scenario: Context flag removed

- **WHEN** this change is implemented
- **THEN** no `--context` flag SHALL exist
- **AND** context SHALL be required positional argument
- **AND** no `dependsOn` flag relationship SHALL exist
