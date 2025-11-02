# proxmox-vm-management Specification Delta

## ADDED Requirements

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
