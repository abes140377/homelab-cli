# proxmox-vm-management Specification

## Purpose
TBD - created by archiving change add-proxmox-lxc-listing. Update Purpose after archive.
## Requirements
### Requirement: Proxmox Resource Type Support

The Proxmox repository SHALL support listing both QEMU virtual machines and LXC containers by accepting a resource type parameter.

#### Scenario: List QEMU virtual machines

- **GIVEN** the repository method `listResources('qemu')` is called
- **WHEN** the Proxmox API returns cluster resources
- **THEN** it SHALL filter resources where `type === 'qemu'` AND `template !== 1`
- **AND** return Result containing array of ProxmoxVMDTO with vmid, name, status, node, and ipv4Address
- **AND** fetch IPv4 addresses from the QEMU guest agent for each VM

#### Scenario: List LXC containers

- **GIVEN** the repository method `listResources('lxc')` is called
- **WHEN** the Proxmox API returns cluster resources
- **THEN** it SHALL filter resources where `type === 'lxc'`
- **AND** return Result containing array of ProxmoxVMDTO with vmid, name, status, node, and ipv4Address
- **AND** fetch IPv4 addresses from the LXC guest agent for each container

#### Scenario: Handle invalid resource type

- **GIVEN** the repository method is called with an invalid resource type
- **WHEN** TypeScript type checking is enabled
- **THEN** it SHALL only accept 'qemu' | 'lxc' as valid types
- **AND** prevent compilation with other values

### Requirement: Repository Interface Contract

The IProxmoxRepository interface SHALL define a method for listing Proxmox resources with type discrimination.

#### Scenario: Repository interface definition

- **GIVEN** the repository interface `IProxmoxRepository`
- **THEN** it SHALL define method `listResources(resourceType: 'qemu' | 'lxc'): Promise<Result<ProxmoxVMDTO[], RepositoryError>>`
- **AND** it SHALL define method `cloneFromTemplate(node: string, templateVmid: number, newVmid: number, vmName: string): Promise<Result<string, RepositoryError>>`
- **AND** it SHALL define method `waitForTask(node: string, upid: string, timeoutMs?: number): Promise<Result<void, RepositoryError>>`
- **AND** the methods SHALL be implemented by all Proxmox repository implementations
- **AND** maintain backward compatibility by removing the deprecated `listVMs()` method

### Requirement: IPv4 Address Retrieval for LXC Containers

The repository SHALL retrieve IPv4 addresses for LXC containers using the Proxmox guest agent API.

#### Scenario: Fetch LXC container IP address via guest agent

- **GIVEN** an LXC container with vmid 100 on node 'pve'
- **WHEN** fetching the IPv4 address
- **THEN** it SHALL call the guest agent endpoint `/nodes/pve/lxc/100/agent/network-get-interfaces`
- **AND** parse the response to extract IPv4 addresses from network interfaces
- **AND** skip loopback interfaces (name contains 'lo')
- **AND** return the first non-loopback IPv4 address found
- **AND** return null if guest agent is unavailable or no IPv4 address is found

#### Scenario: Handle LXC guest agent unavailable

- **GIVEN** an LXC container without guest agent installed
- **WHEN** attempting to fetch IPv4 address
- **THEN** it SHALL catch the error gracefully
- **AND** return null as the IPv4 address
- **AND** NOT fail the entire listing operation

### Requirement: Service Layer Resource Type Parameter

The ProxmoxVMService SHALL accept a resource type parameter and delegate to the repository with proper error handling.

#### Scenario: Service lists QEMU VMs

- **GIVEN** the service method `listVMs('qemu')` is called
- **WHEN** the repository successfully returns QEMU VMs
- **THEN** the service SHALL return Result<ProxmoxVMDTO[], ServiceError> with success
- **AND** the data SHALL contain only QEMU virtual machines

#### Scenario: Service lists LXC containers

- **GIVEN** the service method `listVMs('lxc')` is called
- **WHEN** the repository successfully returns LXC containers
- **THEN** the service SHALL return Result<ProxmoxVMDTO[], ServiceError> with success
- **AND** the data SHALL contain only LXC containers

#### Scenario: Service handles repository errors

- **GIVEN** the repository returns a RepositoryError
- **WHEN** the service processes the error
- **THEN** it SHALL wrap the error in a ServiceError
- **AND** include the original error as the cause
- **AND** return Result with success: false

### Requirement: Command Layer Resource Type Specification

The `homelab proxmox vm list` command SHALL explicitly specify resource type 'qemu' to maintain current behavior.

#### Scenario: VM list command specifies QEMU type

- **GIVEN** the command `homelab proxmox vm list` is executed
- **WHEN** the command calls the service
- **THEN** it SHALL pass 'qemu' as the resource type parameter
- **AND** display only QEMU virtual machines in the output
- **AND** maintain existing table format with columns: VMID, Name, Status, IPv4 Address

### Requirement: Proxmox VM Domain Model Reuse

The existing ProxmoxVMDTO and ProxmoxVMSchema SHALL be reused for both QEMU VMs and LXC containers without modification.

#### Scenario: LXC containers use existing DTO

- **GIVEN** an LXC container resource from the Proxmox API
- **WHEN** mapping to the domain model
- **THEN** it SHALL use the existing ProxmoxVMDTO type
- **AND** populate vmid, name, status, node, and ipv4Address fields
- **AND** pass Zod schema validation with ProxmoxVMSchema

### Requirement: API Endpoint Path Differences

The repository SHALL use different API paths for QEMU and LXC guest agent network information.

#### Scenario: QEMU guest agent endpoint

- **GIVEN** a QEMU VM with vmid 100 on node 'pve'
- **WHEN** fetching network information
- **THEN** it SHALL use endpoint `/nodes/pve/qemu/100/agent/network-get-interfaces`

#### Scenario: LXC guest agent endpoint

- **GIVEN** an LXC container with vmid 100 on node 'pve'
- **WHEN** fetching network information
- **THEN** it SHALL use endpoint `/nodes/pve/lxc/100/agent/network-get-interfaces`

### Requirement: Testing Coverage for Resource Types

The system SHALL include comprehensive tests for both QEMU and LXC resource types.

#### Scenario: Repository tests for QEMU resources

- **WHEN** repository tests are executed
- **THEN** they SHALL verify filtering by type === 'qemu' and template !== 1
- **AND** verify QEMU guest agent API endpoint construction
- **AND** verify IPv4 address extraction for QEMU VMs

#### Scenario: Repository tests for LXC resources

- **WHEN** repository tests are executed
- **THEN** they SHALL verify filtering by type === 'lxc'
- **AND** verify LXC guest agent API endpoint construction
- **AND** verify IPv4 address extraction for LXC containers
- **AND** verify graceful handling of missing guest agent

#### Scenario: Service tests for resource types

- **WHEN** service tests are executed
- **THEN** they SHALL test both 'qemu' and 'lxc' resource types
- **AND** verify correct parameter passing to repository
- **AND** verify error handling for both types

### Requirement: Backward Compatibility

The refactoring SHALL maintain backward compatibility for existing command behavior.

#### Scenario: Existing command behavior unchanged

- **GIVEN** the `homelab proxmox vm list` command existed before this change
- **WHEN** the command is executed after refactoring
- **THEN** it SHALL display the same QEMU VMs as before
- **AND** use the same table format
- **AND** produce identical output for the same Proxmox state
- **AND** NOT display LXC containers (maintains existing QEMU-only behavior)

### Requirement: Repository Method Refactoring

The ProxmoxApiRepository SHALL rename `listVMs()` to `listResources(resourceType)` and implement type-based filtering.

#### Scenario: Method signature change

- **GIVEN** the ProxmoxApiRepository implementation
- **WHEN** reviewing the public interface
- **THEN** it SHALL NOT have a method named `listVMs()`
- **AND** it SHALL have a method named `listResources(resourceType: 'qemu' | 'lxc')`
- **AND** the new method SHALL return Promise<Result<ProxmoxVMDTO[], RepositoryError>>

#### Scenario: Filter resources by type parameter

- **GIVEN** the Proxmox API returns mixed resources (QEMU VMs, LXC containers, templates)
- **WHEN** `listResources('qemu')` is called
- **THEN** it SHALL filter where `type === 'qemu'` AND `template !== 1`
- **WHEN** `listResources('lxc')` is called
- **THEN** it SHALL filter where `type === 'lxc'`

### Requirement: Guest Agent API Abstraction

The repository SHALL abstract guest agent API calls to support both QEMU and LXC resource types.

#### Scenario: Dynamic endpoint construction for QEMU

- **GIVEN** a QEMU VM with vmid 100, node 'pve', and resourceType 'qemu'
- **WHEN** constructing the guest agent endpoint
- **THEN** it SHALL use `/nodes/pve/qemu/100/agent/network-get-interfaces`

#### Scenario: Dynamic endpoint construction for LXC

- **GIVEN** an LXC container with vmid 100, node 'pve', and resourceType 'lxc'
- **WHEN** constructing the guest agent endpoint
- **THEN** it SHALL use `/nodes/pve/lxc/100/agent/network-get-interfaces`

#### Scenario: Unified IPv4 extraction logic

- **GIVEN** network interface data from either QEMU or LXC guest agent
- **WHEN** extracting IPv4 addresses
- **THEN** it SHALL use the same extraction logic for both types
- **AND** look for 'ip-addresses' array in interface objects
- **AND** filter for 'ip-address-type' === 'ipv4'
- **AND** return the first non-loopback IPv4 address

### Requirement: LXC Container List Command

The CLI SHALL provide a command to list all LXC containers from Proxmox with their network information.

#### Scenario: List all LXC containers

- **GIVEN** the command `homelab proxmox container list` is executed
- **WHEN** the user has valid Proxmox credentials configured
- **THEN** the command SHALL invoke `ProxmoxVMService.listVMs('lxc')`
- **AND** display a table with columns: VMID, Name, Status, IPv4 Address
- **AND** sort containers by VMID in ascending order
- **AND** display "N/A" for IPv4 addresses when guest agent is unavailable

#### Scenario: Display empty state for no containers

- **GIVEN** the command `homelab proxmox container list` is executed
- **WHEN** no LXC containers exist in the Proxmox environment
- **THEN** the command SHALL display the message "No containers found"
- **AND** NOT display an empty table
- **AND** exit with status code 0 (success)

#### Scenario: Handle service errors gracefully

- **GIVEN** the command `homelab proxmox container list` is executed
- **WHEN** the service returns a failure Result (e.g., network error, authentication failure)
- **THEN** the command SHALL display an error message: "Failed to list containers: {error.message}"
- **AND** exit with status code 1 (error)
- **AND** NOT display a table

#### Scenario: Consistent output format with VM list command

- **GIVEN** both `homelab proxmox vm list` and `homelab proxmox container list` commands
- **WHEN** comparing their output tables
- **THEN** both SHALL use the same table structure with cli-table3
- **AND** both SHALL use the same column headers: VMID, Name, Status, IPv4 Address
- **AND** both SHALL display "N/A" for missing IPv4 addresses
- **AND** both SHALL sort results by VMID ascending

### Requirement: Command Integration with Existing Architecture

The container list command SHALL follow the established layered architecture pattern.

#### Scenario: Use existing factory for dependency injection

- **GIVEN** the container list command implementation
- **WHEN** the command needs a service instance
- **THEN** it SHALL use `ProxmoxVMFactory.createProxmoxVMService()`
- **AND** NOT create repository or service instances directly
- **AND** rely on the factory to handle configuration and dependency wiring

#### Scenario: Extend BaseCommand class

- **GIVEN** the container list command class definition
- **THEN** it SHALL extend `BaseCommand<typeof ProxmoxContainerList>`
- **AND** implement the `async run(): Promise<void>` method
- **AND** define static `description` property
- **AND** define static `examples` property with sample output

#### Scenario: Handle Result pattern correctly

- **GIVEN** the service returns a `Result<ProxmoxVMDTO[], ServiceError>`
- **WHEN** the command processes the result
- **THEN** it SHALL check `result.success` to determine success or failure
- **AND** call `this.error()` for failure cases (which exits with code 1)
- **AND** access `result.data` only when `result.success === true`

### Requirement: Command File Location and Naming

The container list command SHALL be located in the correct directory structure following oclif conventions.

#### Scenario: Command file path and class name

- **GIVEN** the oclif command structure
- **THEN** the command file SHALL be located at `src/commands/proxmox/container/list.ts`
- **AND** the class SHALL be named `ProxmoxContainerList`
- **AND** this SHALL create the CLI command path `homelab proxmox container list`
- **AND** after compilation, the command SHALL be available in `dist/commands/proxmox/container/list.js`

### Requirement: Command Testing Coverage

The container list command SHALL have comprehensive test coverage.

#### Scenario: Command test file location

- **GIVEN** the test directory structure
- **THEN** the test file SHALL be located at `test/commands/proxmox/container/list.test.ts`
- **AND** mirror the source file structure in `src/commands/proxmox/container/list.ts`

#### Scenario: Test successful container listing

- **WHEN** the command is executed with valid configuration
- **THEN** tests SHALL verify the command calls the service with parameter 'lxc'
- **AND** verify the table output contains expected container data
- **AND** verify the table headers are VMID, Name, Status, IPv4 Address
- **AND** verify containers are sorted by VMID

#### Scenario: Test empty container list

- **WHEN** the service returns an empty array
- **THEN** tests SHALL verify the command outputs "No containers found"
- **AND** verify no table is displayed

#### Scenario: Test service error handling

- **WHEN** the service returns a failure Result
- **THEN** tests SHALL verify the command displays the error message
- **AND** verify the command exits with status code 1

### Requirement: Documentation and Help Text

The container list command SHALL provide clear documentation and help text.

#### Scenario: Command description

- **GIVEN** the command static properties
- **THEN** the `description` property SHALL clearly state: "List all Proxmox LXC containers"
- **AND** help text SHALL be automatically generated by oclif
- **AND** be accessible via `homelab proxmox container list --help`

#### Scenario: Command examples

- **GIVEN** the command static `examples` property
- **THEN** it SHALL include at least one example showing the command invocation
- **AND** include sample table output showing VMID, Name, Status, IPv4 Address columns
- **AND** demonstrate the expected output format for users
