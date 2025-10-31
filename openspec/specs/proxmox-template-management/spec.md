# proxmox-template-management Specification

## Purpose
TBD - created by archiving change add-proxmox-template-list. Update Purpose after archive.
## Requirements
### Requirement: Proxmox Configuration Layer

The system SHALL provide a configuration layer for loading and validating Proxmox connection parameters from environment variables.

#### Scenario: Load valid Proxmox configuration

- **WHEN** the Proxmox configuration is loaded
- **THEN** it SHALL read `PROXMOX_HOST` and `PROXMOX_API_TOKEN` from environment variables
- **AND** validate both values using Zod schema
- **AND** return a configuration object with `host` and `apiToken` properties

#### Scenario: Fail on missing PROXMOX_HOST

- **WHEN** `PROXMOX_HOST` environment variable is not set
- **THEN** the system SHALL throw a configuration error
- **AND** the error message SHALL indicate that `PROXMOX_HOST` is required

#### Scenario: Fail on missing PROXMOX_API_TOKEN

- **WHEN** `PROXMOX_API_TOKEN` environment variable is not set
- **THEN** the system SHALL throw a configuration error
- **AND** the error message SHALL indicate that `PROXMOX_API_TOKEN` is required

#### Scenario: Validate URL format for host

- **WHEN** `PROXMOX_HOST` is set to an invalid URL
- **THEN** the system SHALL throw a validation error
- **AND** the error message SHALL indicate that `PROXMOX_HOST` must be a valid URL

#### Scenario: Validate API token format

- **WHEN** `PROXMOX_API_TOKEN` is set but does not contain `!` and `=` separators
- **THEN** the system SHALL throw a validation error
- **AND** the error message SHALL indicate the expected format `user@realm!tokenid=secret`

### Requirement: Proxmox Template Domain Model

The system SHALL define a Proxmox template domain model with the following attributes:
- `vmid` (number): Virtual Machine ID (unique identifier)
- `name` (string): Template name
- `template` (number): Template status (1 = is template)

The model SHALL be validated using Zod schemas at runtime and provide TypeScript types via type inference.

#### Scenario: Template model structure

- **WHEN** a template is retrieved from the repository
- **THEN** it SHALL contain vmid, name, and template fields
- **AND** all fields SHALL pass Zod schema validation
- **AND** vmid SHALL be a positive integer
- **AND** name SHALL be a non-empty string
- **AND** template SHALL equal 1

### Requirement: Proxmox Repository API Integration

The system SHALL provide a repository that integrates with the Proxmox VE REST API to retrieve VM templates.

#### Scenario: Fetch templates from Proxmox API

- **WHEN** the repository is called to list templates
- **THEN** it SHALL call `GET {host}/api2/json/cluster/resources?type=vm`
- **AND** include `Authorization: PVEAPIToken={tokenID}={secret}` header
- **AND** use a custom HTTPS agent that accepts self-signed SSL certificates
- **AND** filter the response to only include resources where `template === 1`
- **AND** return Result<ProxmoxTemplateDTO[], RepositoryError>

#### Scenario: Parse API token for Authorization header

- **WHEN** API token is `root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce`
- **THEN** the Authorization header SHALL be `PVEAPIToken=homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce`
- **AND** the user portion before `!` SHALL be discarded

#### Scenario: Handle self-signed SSL certificates

- **WHEN** the Proxmox server uses a self-signed SSL certificate
- **THEN** the repository SHALL configure fetch with a custom HTTPS agent
- **AND** the agent SHALL have `rejectUnauthorized: false`
- **AND** the connection SHALL succeed without SSL verification errors

#### Scenario: Handle network errors

- **WHEN** the Proxmox API is unreachable
- **THEN** the repository SHALL return a RepositoryError
- **AND** the error message SHALL indicate connection failure

#### Scenario: Handle authentication errors

- **WHEN** the API returns HTTP 401 or 403
- **THEN** the repository SHALL return a RepositoryError
- **AND** the error message SHALL indicate authentication failure

#### Scenario: Handle API errors

- **WHEN** the API returns HTTP 5xx status code
- **THEN** the repository SHALL return a RepositoryError
- **AND** the error message SHALL indicate server error

#### Scenario: Handle invalid JSON response

- **WHEN** the API returns a non-JSON response
- **THEN** the repository SHALL return a RepositoryError
- **AND** the error message SHALL indicate invalid response format

### Requirement: Template Listing Service

The system SHALL provide a service that orchestrates template retrieval, validation, and sorting.

#### Scenario: List templates successfully

- **WHEN** the service is called to list templates
- **THEN** it SHALL call the repository to fetch templates
- **AND** validate the response data using Zod schema
- **AND** sort templates by vmid in ascending order
- **AND** return Result<ProxmoxTemplateDTO[], ServiceError>

#### Scenario: Handle repository errors

- **WHEN** the repository returns an error
- **THEN** the service SHALL return a ServiceError
- **AND** the error SHALL contain context about the repository failure
- **AND** the original repository error SHALL be included as the cause

#### Scenario: Handle validation errors

- **WHEN** the repository returns data that fails Zod validation
- **THEN** the service SHALL return a ServiceError
- **AND** the error message SHALL indicate validation failure
- **AND** the Zod error details SHALL be included

### Requirement: Proxmox Template List Command

The system SHALL provide a `homelab proxmox template list` command that displays Proxmox VM templates in a formatted table.

#### Scenario: Display templates in table format

- **WHEN** user executes `homelab proxmox template list`
- **AND** templates are available
- **THEN** the system SHALL display templates in a table with columns: VMID, Name, Template
- **AND** use cli-table3 for formatting
- **AND** templates SHALL be sorted by VMID in ascending order
- **AND** the Template column SHALL display "Yes" for all entries

#### Scenario: Handle empty template list

- **WHEN** user executes `homelab proxmox template list`
- **AND** no templates exist
- **THEN** the system SHALL display the message "No templates found"

#### Scenario: Handle configuration errors

- **WHEN** user executes `homelab proxmox template list`
- **AND** required environment variables are missing
- **THEN** the system SHALL display an error message indicating missing configuration
- **AND** exit with status code 1

#### Scenario: Handle service errors

- **WHEN** user executes `homelab proxmox template list`
- **AND** the service returns an error
- **THEN** the system SHALL display a user-friendly error message
- **AND** exit with status code 1

### Requirement: Layered Architecture Implementation

The Proxmox template listing feature SHALL follow the project's layered architecture pattern with clear separation of concerns.

#### Scenario: Command layer handles user interaction

- **WHEN** the proxmox template list command is invoked
- **THEN** the command layer SHALL parse arguments and flags
- **AND** obtain a service instance from the factory
- **AND** handle Result types from the service
- **AND** convert errors to oclif-compatible errors
- **AND** format output using cli-table3

#### Scenario: Service layer contains business logic

- **WHEN** the service is called to list templates
- **THEN** it SHALL orchestrate repository calls
- **AND** apply sorting logic (by vmid ascending)
- **AND** return Result<ProxmoxTemplateDTO[], ServiceError> types
- **AND** be testable in isolation with mock repositories

#### Scenario: Repository layer manages API access

- **WHEN** the repository is called to fetch templates
- **THEN** it SHALL use Node.js native fetch API
- **AND** handle authentication via API token
- **AND** support self-signed SSL certificates
- **AND** filter API response for templates only
- **AND** return Result<ProxmoxTemplateDTO[], RepositoryError> types

#### Scenario: Configuration layer provides validated settings

- **WHEN** the configuration is loaded
- **THEN** it SHALL validate environment variables using Zod
- **AND** fail fast on missing or invalid configuration
- **AND** provide a single source of truth for Proxmox connection parameters

### Requirement: Dependency Injection and Factory Pattern

The Proxmox template feature SHALL use constructor-based dependency injection and factory pattern for dependency wiring.

#### Scenario: Factory wires dependencies

- **WHEN** the Proxmox template factory creates a service
- **THEN** it SHALL load configuration from environment
- **AND** create repository with configuration
- **AND** inject the repository into the service via constructor
- **AND** return a fully-configured service instance ready for use

#### Scenario: Dependencies are explicit

- **WHEN** the service or repository is instantiated
- **THEN** all dependencies SHALL be provided via constructor parameters
- **AND** no hidden dependencies or singletons SHALL be used

### Requirement: Result Pattern Error Handling

The Proxmox template feature SHALL use the Result pattern for explicit, type-safe error handling across all layers.

#### Scenario: Service returns success result

- **WHEN** the repository successfully returns templates
- **THEN** the service SHALL return `{ success: true, data: ProxmoxTemplateDTO[] }`

#### Scenario: Service returns failure result

- **WHEN** the repository returns an error
- **THEN** the service SHALL return `{ success: false, error: ServiceError }`
- **AND** the error SHALL contain context for debugging

#### Scenario: Repository returns success result

- **WHEN** the Proxmox API successfully returns templates
- **THEN** the repository SHALL return `{ success: true, data: ProxmoxTemplateDTO[] }`

#### Scenario: Repository returns failure result

- **WHEN** the API call fails
- **THEN** the repository SHALL return `{ success: false, error: RepositoryError }`
- **AND** the error SHALL contain context about the failure

### Requirement: Comprehensive Testing

The Proxmox template list feature SHALL have comprehensive tests covering all layers.

#### Scenario: Configuration unit tests

- **WHEN** configuration tests are executed
- **THEN** they SHALL verify loading valid configuration
- **AND** test missing environment variable scenarios
- **AND** test invalid URL format
- **AND** test invalid token format

#### Scenario: Command integration tests

- **WHEN** command tests are executed
- **THEN** they SHALL use `runCommand()` from `@oclif/test`
- **AND** verify table output formatting
- **AND** verify empty list message
- **AND** verify error handling
- **AND** mock environment variables and API responses

#### Scenario: Service unit tests

- **WHEN** service tests are executed
- **THEN** they SHALL use mock repositories
- **AND** test both success and failure Result paths
- **AND** verify Zod schema validation
- **AND** verify sorting by vmid ascending

#### Scenario: Repository unit tests

- **WHEN** repository tests are executed
- **THEN** they SHALL mock the fetch API
- **AND** verify API endpoint and query parameters
- **AND** verify Authorization header format
- **AND** verify SSL agent configuration
- **AND** test network error scenarios
- **AND** test HTTP error status codes
- **AND** test invalid JSON responses
- **AND** verify template filtering (template === 1)

### Requirement: External Dependencies

The system SHALL add cli-table3 as a runtime dependency for table formatting.

#### Scenario: cli-table3 dependency

- **WHEN** the package is installed
- **THEN** cli-table3 SHALL be listed in dependencies
- **AND** @types/cli-table3 SHALL be listed in devDependencies
- **AND** the version SHALL be compatible with the project's Node.js requirements

### Requirement: Environment Variables Documentation

The system SHALL document required environment variables for Proxmox integration.

#### Scenario: Environment variables are documented

- **WHEN** a user needs to configure Proxmox integration
- **THEN** documentation SHALL specify `PROXMOX_HOST` format and example
- **AND** documentation SHALL specify `PROXMOX_API_TOKEN` format and example
- **AND** documentation SHALL indicate both variables are required
