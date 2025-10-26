# Proxmox Repository Implementation Specification

## MODIFIED Requirements

### Requirement: Proxmox Repository API Integration

The system SHALL provide a repository that integrates with the Proxmox VE REST API using the `proxmox-api` npm package instead of raw fetch calls.

**Rationale**: The `proxmox-api` package provides a tested, maintained abstraction over the Proxmox REST API, reducing boilerplate and maintenance burden.

#### Scenario: Use proxmox-api package for API calls

- **WHEN** the repository is called to list templates
- **THEN** it SHALL use the `proxmox-api` package to create a client
- **AND** configure the client with `host`, `port`, `tokenID`, and `tokenSecret`
- **AND** call `proxmox.cluster.resources.$get({type: 'vm'})` to fetch VMs
- **AND** filter the response to only include resources where `template === 1`
- **AND** return Result<ProxmoxTemplateDTO[], RepositoryError>

#### Scenario: Construct tokenID from configuration

- **WHEN** the repository initializes the proxmox-api client
- **THEN** it SHALL construct tokenID as `{user}@{realm}!{tokenKey}`
- **AND** pass tokenSecret separately from configuration
- **AND** the package SHALL handle HTTP headers and authentication internally

#### Scenario: Handle network errors

- **WHEN** the Proxmox API is unreachable
- **THEN** the repository SHALL catch errors from proxmox-api
- **AND** return a RepositoryError with appropriate error message
- **AND** include the original error as cause for debugging

#### Scenario: Handle authentication errors

- **WHEN** the API returns authentication failure
- **THEN** the proxmox-api package SHALL throw an error
- **AND** the repository SHALL catch it and return a RepositoryError
- **AND** the error message SHALL indicate connection failure

#### Scenario: Simplified implementation

- **WHEN** comparing the new implementation to the old one
- **THEN** the new implementation SHALL be significantly shorter (~47% reduction in lines)
- **AND** delegate HTTP request handling to proxmox-api package
- **AND** delegate SSL certificate handling to proxmox-api package
- **AND** focus only on business logic (filtering templates, mapping DTOs)

## REMOVED Requirements

### Requirement: Manual fetch API Implementation

The system NO LONGER uses Node.js native fetch API directly for Proxmox API calls.

**Rationale**: The fetch-based implementation is replaced by the `proxmox-api` package which provides better abstraction.

#### Scenario: Manual HTTP request handling (REMOVED)

- **WHEN** the repository needs to call the Proxmox API
- **THEN** it SHALL NOT manually construct HTTP requests using fetch
- **AND** it SHALL NOT manually set Authorization headers
- **AND** it SHALL NOT manually configure HTTPS agents
- **AND** it SHALL NOT manually handle SSL certificate rejection

#### Scenario: Manual SSL configuration (REMOVED)

- **WHEN** the Proxmox server uses a self-signed SSL certificate
- **THEN** the repository SHALL NOT manipulate `NODE_TLS_REJECT_UNAUTHORIZED`
- **AND** the repository SHALL NOT create custom HTTPS agents
- **AND** SSL handling SHALL be delegated to the proxmox-api package

#### Scenario: Manual token parsing (REMOVED)

- **WHEN** constructing the Authorization header
- **THEN** the repository SHALL NOT manually split the API token
- **AND** the repository SHALL NOT manually format the Authorization header
- **AND** authentication SHALL be handled by proxmox-api package

## UNCHANGED Requirements

### Requirement: Repository Interface Compliance

The repository SHALL continue to implement the `IProxmoxRepository` interface.

#### Scenario: Interface contract preserved

- **WHEN** the repository is instantiated
- **THEN** it SHALL implement all methods defined in `IProxmoxRepository`
- **AND** maintain the same method signatures
- **AND** return the same Result<T, E> types
- **AND** be substitutable for any other implementation of the interface

### Requirement: Template Filtering and Mapping

The repository SHALL continue to filter and map templates from API responses.

#### Scenario: Filter only templates

- **WHEN** the API returns VM resources
- **THEN** the repository SHALL filter to include only resources where `template === 1`
- **AND** exclude regular VMs (template === 0 or undefined)

#### Scenario: Map to ProxmoxTemplateDTO

- **WHEN** template data is received from the API
- **THEN** the repository SHALL map each template to ProxmoxTemplateDTO
- **AND** include vmid, name, and template fields
- **AND** handle missing fields with appropriate defaults

### Requirement: Result Pattern Error Handling

The repository SHALL continue to use the Result pattern for error handling.

#### Scenario: Return success result

- **WHEN** templates are successfully retrieved from the API
- **THEN** the repository SHALL return `{ success: true, data: ProxmoxTemplateDTO[] }`

#### Scenario: Return failure result

- **WHEN** API call fails for any reason
- **THEN** the repository SHALL return `{ success: false, error: RepositoryError }`
- **AND** include error context for debugging
- **AND** include the original error as cause when available
