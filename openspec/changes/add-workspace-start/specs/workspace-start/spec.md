# Workspace Start Capability Specification

## ADDED Requirements

### Requirement: Workspace Context Domain Model

The system SHALL define a workspace context domain model to represent development contexts associated with workspaces.

#### Scenario: Context model structure

- **WHEN** a context is retrieved from the repository
- **THEN** it SHALL contain id, name, createdAt, and updatedAt fields
- **AND** all fields SHALL pass Zod schema validation

#### Scenario: Workspace includes contexts

- **WHEN** a workspace with contexts is retrieved
- **THEN** the workspace SHALL include an optional contexts array
- **AND** each context SHALL be validated using WorkspaceContextSchema
- **AND** contexts array SHALL be empty if no contexts exist

### Requirement: Workspace Start Command

The system SHALL provide a `homelab workspace start <workspace-name>` command that launches a workspace in either VSCode or terminal.

#### Scenario: Start workspace with VSCode

- **WHEN** user executes `homelab workspace start <workspace-name> --vscode`
- **AND** workspace has exactly one context
- **THEN** the system SHALL automatically select that context
- **AND** launch VSCode with the workspace file at `~/projects/<workspace-name>/<context-name>.code-workspace`
- **AND** exit successfully

#### Scenario: Start workspace with VSCode and context selection

- **WHEN** user executes `homelab workspace start <workspace-name> --vscode --context <context-name>`
- **AND** workspace has multiple contexts
- **AND** specified context exists
- **THEN** the system SHALL launch VSCode with the specified context's workspace file
- **AND** exit successfully

#### Scenario: Start workspace with terminal

- **WHEN** user executes `homelab workspace start <workspace-name> --terminal`
- **THEN** the system SHALL spawn an interactive shell at directory `~/projects/<workspace-name>/`
- **AND** user SHALL be in an interactive terminal session at the workspace directory

#### Scenario: Require flag selection

- **WHEN** user executes `homelab workspace start <workspace-name>` without flags
- **THEN** the system SHALL display an error indicating --vscode or --terminal is required
- **AND** exit with non-zero status code

#### Scenario: Prevent multiple flags

- **WHEN** user executes `homelab workspace start <workspace-name> --vscode --terminal`
- **THEN** oclif SHALL prevent the command execution
- **AND** display error indicating flags are mutually exclusive

#### Scenario: Multiple contexts without context selection

- **WHEN** user executes `homelab workspace start <workspace-name> --vscode`
- **AND** workspace has multiple contexts
- **AND** --context flag is not provided
- **THEN** the system SHALL display error listing available contexts
- **AND** instruct user to specify --context flag
- **AND** exit with non-zero status code

#### Scenario: Context not found

- **WHEN** user executes `homelab workspace start <workspace-name> --vscode --context <invalid-context>`
- **AND** specified context does not exist in workspace
- **THEN** the system SHALL display error indicating context not found
- **AND** list available contexts
- **AND** exit with non-zero status code

#### Scenario: Workspace not found

- **WHEN** user executes `homelab workspace start <invalid-workspace>` with any flags
- **AND** workspace does not exist in PocketBase
- **THEN** the system SHALL display error indicating workspace not found
- **AND** suggest running `homelab workspace list` to see available workspaces
- **AND** exit with non-zero status code

#### Scenario: No contexts for workspace

- **WHEN** user executes `homelab workspace start <workspace-name> --vscode`
- **AND** workspace has no contexts configured
- **THEN** the system SHALL display error indicating no contexts found
- **AND** instruct user to configure contexts in PocketBase
- **AND** exit with non-zero status code

### Requirement: Find Workspace by Name

The system SHALL provide repository method to find a single workspace by name including its contexts.

#### Scenario: Find workspace by name successfully

- **WHEN** `repository.findByName(name)` is called
- **AND** workspace with matching name exists in PocketBase
- **THEN** the repository SHALL fetch the workspace record using name filter
- **AND** expand the contexts relation in the same query
- **AND** return success Result with WorkspaceDTO including contexts array

#### Scenario: Map expanded contexts

- **WHEN** PocketBase returns workspace record with expanded contexts
- **THEN** the repository SHALL map each context record to WorkspaceContextDTO
- **AND** include all context fields (id, name, createdAt, updatedAt)
- **AND** validate contexts using WorkspaceContextSchema

#### Scenario: Workspace not found by name

- **WHEN** `repository.findByName(name)` is called
- **AND** no workspace with matching name exists
- **THEN** the repository SHALL return failure Result
- **AND** error SHALL be RepositoryError with message indicating workspace not found
- **AND** error message SHALL include the workspace name searched

#### Scenario: Handle empty contexts

- **WHEN** workspace exists but has no contexts
- **THEN** the repository SHALL return success Result
- **AND** contexts array SHALL be empty

### Requirement: Workspace Launcher Service

The system SHALL provide a workspace launcher service that handles launching VSCode and terminal environments.

#### Scenario: Launch VSCode with workspace file

- **WHEN** `launcherService.launchVSCode(workspaceName, contextName)` is called
- **AND** workspace file exists at `~/projects/<workspaceName>/<contextName>.code-workspace`
- **THEN** the service SHALL execute `code "<workspace-file-path>"`
- **AND** return success Result

#### Scenario: VSCode workspace file not found

- **WHEN** `launcherService.launchVSCode(workspaceName, contextName)` is called
- **AND** workspace file does not exist
- **THEN** the service SHALL return failure Result
- **AND** error SHALL indicate workspace file not found
- **AND** error SHALL include the full path searched

#### Scenario: VSCode command fails

- **WHEN** `launcherService.launchVSCode(workspaceName, contextName)` is called
- **AND** `code` command execution fails
- **THEN** the service SHALL return failure Result
- **AND** error SHALL indicate VSCode launch failed
- **AND** error SHALL include the underlying error cause

#### Scenario: Open terminal at workspace directory

- **WHEN** `launcherService.openTerminal(workspaceName)` is called
- **AND** workspace directory exists at `~/projects/<workspaceName>/`
- **THEN** the service SHALL spawn interactive shell at the directory
- **AND** use $SHELL environment variable or fallback to /bin/bash
- **AND** return success Result after shell process completes

#### Scenario: Workspace directory not found

- **WHEN** `launcherService.openTerminal(workspaceName)` is called
- **AND** workspace directory does not exist
- **THEN** the service SHALL return failure Result
- **AND** error SHALL indicate workspace directory not found
- **AND** error SHALL include the full path searched

#### Scenario: Terminal spawn fails

- **WHEN** `launcherService.openTerminal(workspaceName)` is called
- **AND** shell spawn fails
- **THEN** the service SHALL return failure Result
- **AND** error SHALL indicate terminal launch failed
- **AND** error SHALL include the underlying error cause

### Requirement: Path Construction

The system SHALL construct workspace paths using fixed pattern based on workspace and context names.

#### Scenario: Construct workspace directory path

- **WHEN** workspace directory path is needed
- **THEN** path SHALL be constructed as `$HOME/projects/<workspaceName>/`
- **AND** path SHALL use user's home directory from `os.homedir()`
- **AND** path construction SHALL use `path.join()` for cross-platform compatibility

#### Scenario: Construct VSCode workspace file path

- **WHEN** VSCode workspace file path is needed
- **THEN** path SHALL be constructed as `$HOME/projects/<workspaceName>/<contextName>.code-workspace`
- **AND** context name SHALL be used as-is without modification
- **AND** .code-workspace extension SHALL be appended

### Requirement: Command Flag Validation

The system SHALL validate command flags to ensure exactly one launch target is specified.

#### Scenario: Validate mutually exclusive flags

- **WHEN** command flags are parsed
- **THEN** exactly one of --vscode or --terminal SHALL be required
- **AND** providing both SHALL be prevented by oclif exclusive flag relationship
- **AND** providing neither SHALL result in validation error

#### Scenario: Context flag requires VSCode flag

- **WHEN** --context flag is provided
- **AND** --vscode flag is not provided
- **THEN** command validation SHALL fail
- **AND** error SHALL indicate --context requires --vscode

### Requirement: Error Messages and User Guidance

The system SHALL provide clear, actionable error messages for all failure scenarios.

#### Scenario: Workspace not found message

- **WHEN** workspace is not found in PocketBase
- **THEN** error message SHALL state "Workspace '<name>' not found"
- **AND** SHALL suggest running 'homelab workspace list' to see available workspaces

#### Scenario: Multiple contexts message

- **WHEN** multiple contexts exist and --context not provided
- **THEN** error message SHALL list all available context names
- **AND** SHALL instruct to specify --context flag

#### Scenario: Context not found message

- **WHEN** specified context does not exist
- **THEN** error message SHALL state "Context '<name>' not found"
- **AND** SHALL list all available context names for the workspace

#### Scenario: Workspace file not found message

- **WHEN** VSCode workspace file is missing
- **THEN** error message SHALL include full file path searched
- **AND** SHALL indicate file does not exist

#### Scenario: Workspace directory not found message

- **WHEN** workspace directory is missing
- **THEN** error message SHALL include full directory path searched
- **AND** SHALL indicate directory does not exist

#### Scenario: VSCode CLI not available message

- **WHEN** `code` command is not found in PATH
- **THEN** error message SHALL indicate VSCode CLI is not installed
- **AND** SHALL provide link to installation instructions

### Requirement: Layered Architecture Compliance

The workspace start feature SHALL follow the project's layered architecture pattern.

#### Scenario: Command layer orchestrates services

- **WHEN** workspace start command executes
- **THEN** command SHALL obtain workspace service from factory
- **AND** command SHALL create launcher service instance
- **AND** command SHALL orchestrate calls to both services
- **AND** command SHALL handle Result types from services
- **AND** command SHALL convert errors to oclif-compatible errors

#### Scenario: Service layer contains business logic

- **WHEN** launcher service is called
- **THEN** service SHALL validate paths exist before execution
- **AND** service SHALL execute system commands
- **AND** service SHALL return Result<void, ServiceError> types
- **AND** service SHALL be testable in isolation

#### Scenario: Repository layer fetches workspace data

- **WHEN** findByName is called
- **THEN** repository SHALL fetch from PocketBase
- **AND** repository SHALL expand contexts relation
- **AND** repository SHALL map and validate data
- **AND** repository SHALL return Result<WorkspaceDTO, RepositoryError>

### Requirement: Testing Coverage

The workspace start feature SHALL have comprehensive test coverage at all layers.

#### Scenario: Launcher service unit tests

- **WHEN** launcher service tests execute
- **THEN** tests SHALL mock file system operations
- **AND** tests SHALL mock command execution
- **AND** tests SHALL verify success paths
- **AND** tests SHALL verify failure paths (file missing, command fails)

#### Scenario: Repository unit tests for findByName

- **WHEN** repository tests execute
- **THEN** tests SHALL mock PocketBase client
- **AND** tests SHALL verify name filter and expand parameters
- **AND** tests SHALL verify context mapping
- **AND** tests SHALL verify 404 error handling

#### Scenario: Command integration tests

- **WHEN** command tests execute
- **THEN** tests SHALL mock services via factory
- **AND** tests SHALL verify flag combinations
- **AND** tests SHALL verify error message formatting
- **AND** tests SHALL verify context selection logic

## MODIFIED Requirements

### Requirement: Workspace Domain Model (Modified from workspace-management spec)

The workspace domain model SHALL be extended to include optional contexts array.

**Changes:**
- Add optional `contexts` field as array of WorkspaceContextDTO
- Contexts array SHALL be empty if workspace has no contexts
- WorkspaceSchema SHALL validate contexts using WorkspaceContextSchema array validation

#### Scenario: Workspace with contexts

- **WHEN** workspace is retrieved with contexts
- **THEN** contexts field SHALL contain array of WorkspaceContextDTO objects
- **AND** each context SHALL have id, name, createdAt, updatedAt fields

#### Scenario: Workspace without contexts

- **WHEN** workspace is retrieved without contexts
- **THEN** contexts field SHALL be undefined or empty array
- **AND** workspace SHALL still pass validation

### Requirement: Workspace Repository Interface (Modified from workspace-management spec)

The workspace repository interface SHALL include findByName method.

**Changes:**
- Add `findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>>` method
- Method SHALL fetch single workspace by name with contexts expanded

#### Scenario: Interface contract

- **WHEN** repository implements IWorkspaceRepository
- **THEN** it SHALL implement both findAll and findByName methods
- **AND** both methods SHALL return Result types
- **AND** findByName SHALL return single WorkspaceDTO, not array

### Requirement: PocketBase Workspace Repository (Modified from pocketbase-workspace-listing spec)

The PocketBase workspace repository SHALL be extended to implement findByName with context expansion.

**Changes:**
- Implement `findByName(name: string)` method
- Use PocketBase `getFirstListItem()` with name filter
- Use `expand: 'contexts'` parameter to fetch related contexts
- Map expanded contexts to WorkspaceContextDTO array

#### Scenario: Fetch with context expansion

- **WHEN** `findByName()` is called
- **THEN** repository SHALL call `getFirstListItem(\`name="${name}"\`, {expand: 'contexts'})`
- **AND** repository SHALL map record.expand.contexts to contexts array
- **AND** repository SHALL validate all data with Zod schemas
