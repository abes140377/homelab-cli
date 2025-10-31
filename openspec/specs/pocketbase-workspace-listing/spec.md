# pocketbase-workspace-listing Specification

## Purpose
TBD - created by archiving change integrate-pocketbase-workspaces. Update Purpose after archive.
## Requirements
### Requirement: PocketBase SDK Integration

The system SHALL integrate the PocketBase JavaScript SDK to enable communication with PocketBase backend.

#### Scenario: PocketBase SDK is installed

- **WHEN** the project dependencies are installed
- **THEN** the `pocketbase` npm package SHALL be available
- **AND** the package SHALL be listed in package.json dependencies
- **AND** TypeScript types SHALL be available for PocketBase client

#### Scenario: PocketBase client initialization

- **WHEN** the PocketBase repository is instantiated
- **THEN** it SHALL create a PocketBase client with the configured URL
- **AND** the client SHALL be ready to make API requests

### Requirement: PocketBase Configuration Management

The system SHALL provide configuration management for PocketBase connection settings using environment variables.

#### Scenario: Load valid PocketBase configuration

- **WHEN** `loadPocketBaseConfig()` is called
- **AND** POCKETBASE_URL environment variable is set to a valid URL
- **THEN** the function SHALL return a validated configuration object
- **AND** the configuration SHALL contain the URL

#### Scenario: Missing required configuration

- **WHEN** `loadPocketBaseConfig()` is called
- **AND** POCKETBASE_URL environment variable is not set
- **THEN** the function SHALL throw an error
- **AND** the error message SHALL indicate POCKETBASE_URL is required

#### Scenario: Invalid URL format

- **WHEN** `loadPocketBaseConfig()` is called
- **AND** POCKETBASE_URL is not a valid URL format
- **THEN** Zod validation SHALL fail
- **AND** the error SHALL indicate the URL format is invalid

#### Scenario: Optional authentication configuration

- **WHEN** `loadPocketBaseConfig()` is called
- **AND** POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are provided
- **THEN** the configuration SHALL include these credentials
- **AND** they SHALL be available for authentication

#### Scenario: Missing optional authentication

- **WHEN** `loadPocketBaseConfig()` is called
- **AND** authentication credentials are not provided
- **THEN** the configuration SHALL be valid
- **AND** authentication fields SHALL be undefined

### Requirement: PocketBase Workspace Repository

The system SHALL implement a PocketBase workspace repository that fetches workspaces from PocketBase 'workspaces' collection.

#### Scenario: Fetch workspaces from PocketBase

- **WHEN** `repository.findAll()` is called
- **AND** PocketBase instance is reachable
- **AND** 'workspaces' collection exists
- **THEN** the repository SHALL fetch all workspace records using `getFullList()`
- **AND** return a success Result with array of WorkspaceDTO objects

#### Scenario: Map PocketBase records to domain model

- **WHEN** PocketBase returns workspace records
- **THEN** the repository SHALL map `created` field to `createdAt` as Date
- **AND** map `updated` field to `updatedAt` as Date
- **AND** map `id` and `name` fields directly
- **AND** validate mapped data using WorkspaceSchema

#### Scenario: Authenticate when credentials provided

- **WHEN** the repository is initialized
- **AND** admin email and password are configured
- **THEN** the repository SHALL authenticate using `admins.authWithPassword()`
- **AND** subsequent API calls SHALL use the authenticated session

#### Scenario: Skip authentication when no credentials

- **WHEN** the repository is initialized
- **AND** no admin credentials are configured
- **THEN** the repository SHALL NOT attempt authentication
- **AND** API calls SHALL proceed unauthenticated

#### Scenario: Handle connection errors

- **WHEN** `repository.findAll()` is called
- **AND** PocketBase instance is unreachable
- **THEN** the repository SHALL return a failure Result
- **AND** the error SHALL be a RepositoryError
- **AND** the error message SHALL indicate connection failure

#### Scenario: Handle authentication errors

- **WHEN** authentication is attempted with invalid credentials
- **THEN** the repository SHALL return a failure Result
- **AND** the error message SHALL indicate authentication failure

#### Scenario: Handle collection not found

- **WHEN** `repository.findAll()` is called
- **AND** 'workspaces' collection does not exist
- **THEN** the repository SHALL return a failure Result
- **AND** the error message SHALL indicate collection not found or permission denied

#### Scenario: Handle invalid data from PocketBase

- **WHEN** PocketBase returns records with unexpected schema
- **THEN** Zod validation SHALL fail
- **AND** the repository SHALL return a failure Result
- **AND** the error message SHALL indicate data validation failure

#### Scenario: Handle empty workspace collection

- **WHEN** `repository.findAll()` is called
- **AND** 'workspaces' collection is empty
- **THEN** the repository SHALL return success Result with empty array

### Requirement: PocketBase Workspace List Command

The system SHALL provide a `homelab workspace list-pocketbase` command that displays workspaces from PocketBase.

#### Scenario: List workspaces from PocketBase successfully

- **WHEN** user executes `homelab workspace list-pocketbase`
- **AND** PocketBase is configured and reachable
- **AND** workspace data is available
- **THEN** the system SHALL display all workspaces from PocketBase
- **AND** output SHALL be formatted in a table with id, name, createdAt, updatedAt columns
- **AND** table format SHALL match existing workspace list command format

#### Scenario: Handle missing PocketBase configuration

- **WHEN** user executes `homelab workspace list-pocketbase`
- **AND** POCKETBASE_URL is not set
- **THEN** the command SHALL display an error message
- **AND** the error SHALL indicate POCKETBASE_URL is required
- **AND** exit with non-zero status code

#### Scenario: Handle PocketBase connection failure

- **WHEN** user executes `homelab workspace list-pocketbase`
- **AND** PocketBase instance is unreachable
- **THEN** the command SHALL display a user-friendly error message
- **AND** the error SHALL suggest checking the URL and instance status
- **AND** exit with non-zero status code

#### Scenario: Handle empty PocketBase workspace collection

- **WHEN** user executes `homelab workspace list-pocketbase`
- **AND** no workspaces exist in PocketBase
- **THEN** the command SHALL display "No workspaces found."
- **AND** exit with zero status code

#### Scenario: Display authentication errors clearly

- **WHEN** user executes `homelab workspace list-pocketbase`
- **AND** authentication fails
- **THEN** the command SHALL display an error indicating invalid credentials
- **AND** exit with non-zero status code

### Requirement: PocketBase Factory Pattern

The system SHALL provide a factory for creating workspace services with PocketBase repository.

#### Scenario: Factory creates PocketBase service

- **WHEN** `PocketBaseWorkspaceFactory.createWorkspaceService()` is called
- **THEN** it SHALL load PocketBase configuration
- **AND** create PocketBaseWorkspaceRepository with configuration
- **AND** create WorkspaceService with the repository
- **AND** return fully-wired service instance

#### Scenario: Factory handles configuration errors

- **WHEN** `PocketBaseWorkspaceFactory.createWorkspaceService()` is called
- **AND** configuration loading fails
- **THEN** the configuration error SHALL propagate to the caller
- **AND** the error message SHALL be descriptive

### Requirement: Layered Architecture Compliance

The PocketBase integration SHALL follow the project's layered architecture pattern.

#### Scenario: Repository implements interface

- **WHEN** PocketBaseWorkspaceRepository is defined
- **THEN** it SHALL implement IWorkspaceRepository interface
- **AND** all interface methods SHALL be implemented
- **AND** return types SHALL match the interface contract (Result types)

#### Scenario: Service layer is reusable

- **WHEN** WorkspaceService is used with PocketBase repository
- **THEN** the service SHALL work without modifications
- **AND** business logic SHALL be independent of data source
- **AND** Result pattern SHALL flow correctly through layers

#### Scenario: Command layer handles Results

- **WHEN** list-pocketbase command receives Result from service
- **THEN** it SHALL check success status
- **AND** on success, format and display data
- **AND** on failure, convert to oclif error with user-friendly message

### Requirement: Error Handling and User Experience

The PocketBase integration SHALL provide clear, actionable error messages for all failure scenarios.

#### Scenario: Network error message

- **WHEN** a network connection error occurs
- **THEN** the error message SHALL include the PocketBase URL
- **AND** suggest checking network connectivity and instance status

#### Scenario: Authentication error message

- **WHEN** authentication fails
- **THEN** the error message SHALL indicate invalid credentials
- **AND** NOT expose password in error message
- **AND** suggest checking POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD

#### Scenario: Collection permission error message

- **WHEN** collection access is denied
- **THEN** the error message SHALL indicate permission denied
- **AND** suggest checking collection rules or providing authentication

#### Scenario: Data validation error message

- **WHEN** PocketBase returns invalid data
- **THEN** the error message SHALL indicate data validation failure
- **AND** include which fields failed validation

### Requirement: Testing Coverage

The PocketBase integration SHALL have comprehensive test coverage at all layers.

#### Scenario: Configuration tests

- **WHEN** configuration tests are executed
- **THEN** they SHALL verify successful config loading with valid env vars
- **AND** test missing required variables
- **AND** test invalid URL format
- **AND** test optional authentication fields

#### Scenario: Repository unit tests

- **WHEN** repository tests are executed
- **THEN** they SHALL mock PocketBase client
- **AND** test success path with valid data
- **AND** test authentication when credentials provided
- **AND** test connection errors
- **AND** test authentication errors
- **AND** test collection not found errors
- **AND** test data validation errors
- **AND** test empty collection

#### Scenario: Command tests

- **WHEN** command tests are executed
- **THEN** they SHALL mock PocketBaseWorkspaceFactory
- **AND** test successful output formatting
- **AND** test configuration error handling
- **AND** test connection error handling
- **AND** test empty workspace list

#### Scenario: Integration tests (optional)

- **WHEN** integration tests are executed
- **AND** POCKETBASE_URL is configured
- **THEN** they SHALL make real API calls to PocketBase
- **AND** verify end-to-end functionality
- **AND** skip gracefully if PocketBase is not available

### Requirement: Documentation

The PocketBase integration SHALL be properly documented.

#### Scenario: README updated automatically

- **WHEN** `pnpm run prepack` is executed
- **THEN** README SHALL include `workspace list-pocketbase` command
- **AND** command description SHALL be clear
- **AND** oclif SHALL generate documentation automatically

#### Scenario: Environment variables documented

- **WHEN** developers review configuration
- **THEN** required POCKETBASE_URL SHALL be documented
- **AND** optional authentication variables SHALL be documented
- **AND** examples SHALL be provided

### Requirement: Dependency Management

The PocketBase SDK SHALL be properly managed as a project dependency.

#### Scenario: Package installation

- **WHEN** `pnpm add pocketbase` is executed
- **THEN** pocketbase SHALL be added to package.json dependencies
- **AND** lockfile SHALL be updated
- **AND** TypeScript types SHALL be available

#### Scenario: Import compatibility

- **WHEN** PocketBase is imported in TypeScript
- **THEN** import SHALL use ES modules syntax
- **AND** TypeScript SHALL recognize PocketBase types
- **AND** compilation SHALL succeed without errors
