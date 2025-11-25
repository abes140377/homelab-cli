# vm-start-capability Specification

## Purpose
TBD - created by archiving change add-proxmox-vm-start-command. Update Purpose after archive.
## Requirements
### Requirement: Repository VM Start Operation

The IProxmoxRepository interface SHALL define a method to start a stopped VM via the Proxmox API.

#### Scenario: Start VM successfully

- **GIVEN** a stopped VM with vmid 100 on node 'pve'
- **WHEN** `startVM('pve', 100)` is called
- **THEN** it SHALL POST to `/nodes/pve/qemu/100/status/start`
- **AND** return Result containing task UPID string on success
- **AND** the Proxmox API SHALL queue a task to start the VM

#### Scenario: Start already running VM

- **GIVEN** a running VM with vmid 100 on node 'pve'
- **WHEN** `startVM('pve', 100)` is called
- **THEN** it SHALL POST to `/nodes/pve/qemu/100/status/start`
- **AND** the Proxmox API MAY return success (no-op)
- **AND** return Result containing task UPID or success indicator

#### Scenario: Handle VM not found error

- **GIVEN** no VM exists with vmid 999
- **WHEN** `startVM('pve', 999)` is called
- **THEN** the Proxmox API SHALL return an error
- **AND** the repository SHALL wrap it in a RepositoryError
- **AND** return Result with success: false
- **AND** the error message SHALL indicate the VM was not found

#### Scenario: Handle network/API errors

- **GIVEN** the Proxmox API is unreachable
- **WHEN** `startVM('pve', 100)` is called
- **THEN** the repository SHALL catch the network error
- **AND** wrap it in a RepositoryError with descriptive message
- **AND** return Result with success: false
- **AND** include the original error as cause for debugging

### Requirement: Service Layer VM Start Operation

The ProxmoxVMService SHALL provide a method to start VMs with proper error handling and business logic.

#### Scenario: Service starts VM successfully

- **GIVEN** a service instance with properly configured repository
- **WHEN** `startVM(100)` is called
- **THEN** it SHALL determine the VM's node by listing VMs
- **AND** call repository's `startVM(node, vmid)` method
- **AND** optionally wait for the start task to complete
- **AND** return Result<{vmid: number, name: string, node: string}, ServiceError> on success

#### Scenario: Service handles VM not found in listing

- **GIVEN** VM 999 does not exist in the cluster
- **WHEN** `startVM(999)` is called
- **THEN** it SHALL list all VMs to find the VM's node
- **AND** NOT find VM 999 in the list
- **AND** return ServiceError with message indicating VM not found
- **AND** suggest using 'homelab proxmox vm list' to see available VMs

#### Scenario: Service handles repository errors

- **GIVEN** the repository returns a RepositoryError
- **WHEN** the service processes the error
- **THEN** it SHALL wrap the error in a ServiceError
- **AND** include the original error as cause
- **AND** provide a user-friendly error message
- **AND** return Result with success: false

### Requirement: Command Layer VM Start Interface

The CLI SHALL provide a command to start one or more VMs by VM ID.

#### Scenario: Start single VM by ID

- **GIVEN** the command `homelab proxmox vm start 100` is executed
- **WHEN** VM 100 exists and is stopped
- **THEN** the command SHALL call service's `startVM(100)` method
- **AND** display message "Starting VM 100 'vm-name' on node 'pve'..."
- **AND** display success message "Successfully started VM 100"
- **AND** exit with status code 0

#### Scenario: Start multiple VMs by ID

- **GIVEN** the command `homelab proxmox vm start 100 101 102` is executed
- **WHEN** all VMs exist
- **THEN** the command SHALL start each VM sequentially
- **AND** display progress "[1/3] Starting VM 100 'vm-name' on node 'pve'..."
- **AND** display summary showing successful: 3, failed: 0
- **AND** exit with status code 0 if all succeed

#### Scenario: Handle partial failures in batch start

- **GIVEN** the command `homelab proxmox vm start 100 999` is executed
- **WHEN** VM 100 exists but VM 999 does not
- **THEN** the command SHALL attempt to start both VMs
- **AND** start VM 100 successfully
- **AND** fail to start VM 999 with error
- **AND** display summary: "Successful: 1, Failed: 1"
- **AND** list failed VMs with reasons
- **AND** exit with status code 1

#### Scenario: Handle invalid VM ID in arguments

- **GIVEN** the command `homelab proxmox vm start 100 101` is executed
- **WHEN** VM 101 does not exist
- **THEN** the command SHALL list all VMs to validate IDs
- **AND** detect that VM 101 is not found
- **AND** display error: "VM 101 not found. Use 'homelab proxmox vm list' to see available VMs."
- **AND** NOT attempt to start any VMs
- **AND** exit with status code 1

### Requirement: Interactive VM Selection for Start

The command SHALL support interactive selection of VMs when no VM IDs are provided.

#### Scenario: Interactive mode lists only stopped VMs

- **GIVEN** the command `homelab proxmox vm start` is executed (no args)
- **WHEN** the Proxmox cluster has 3 stopped VMs and 2 running VMs
- **THEN** the command SHALL list all VMs from the service
- **AND** filter VMs where status === 'stopped'
- **AND** present only the 3 stopped VMs to the user for selection
- **AND** NOT show running VMs in the selection list

#### Scenario: User selects multiple VMs interactively

- **GIVEN** interactive selection prompt is displayed
- **WHEN** user selects VMs 100 and 102 using space bar
- **AND** confirms selection with enter
- **THEN** the command SHALL receive selected VMIDs [100, 102]
- **AND** start both VMs sequentially
- **AND** display progress and summary

#### Scenario: User cancels interactive selection

- **GIVEN** interactive selection prompt is displayed
- **WHEN** user presses Ctrl+C or ESC
- **THEN** the command SHALL catch the cancellation
- **AND** display message "Selection cancelled"
- **AND** exit with status code 0 (not an error)

#### Scenario: No stopped VMs available for selection

- **GIVEN** the command `homelab proxmox vm start` is executed (no args)
- **WHEN** all VMs in the cluster are running or no VMs exist
- **THEN** the command SHALL display "No stopped VMs available to start"
- **AND** NOT show selection prompt
- **AND** exit with status code 0

### Requirement: Command Arguments and Flags

The command SHALL accept variadic VM IDs as arguments.

#### Scenario: Parse multiple VM ID arguments

- **GIVEN** the command class defines variadic vmids argument
- **WHEN** command is invoked with `homelab proxmox vm start 100 101 102`
- **THEN** it SHALL parse argv as integers [100, 101, 102]
- **AND** filter out any non-numeric values
- **AND** use parsed VMIDs for start operations

#### Scenario: Handle non-numeric arguments gracefully

- **GIVEN** the command `homelab proxmox vm start 100 abc 101` is executed
- **WHEN** parsing arguments
- **THEN** it SHALL parse 100 and 101 as valid integers
- **AND** filter out 'abc' as invalid
- **AND** proceed with valid VMIDs [100, 101]

### Requirement: JSON Output Mode Support

The command SHALL support --json flag for machine-readable output.

#### Scenario: JSON output for single VM start

- **GIVEN** the command `homelab proxmox vm start 100 --json` is executed
- **WHEN** VM 100 starts successfully
- **THEN** it SHALL return JSON object:
  ```json
  {
    "vmid": 100,
    "name": "web-server",
    "node": "pve",
    "status": "started"
  }
  ```
- **AND** NOT display human-readable messages
- **AND** exit with status code 0

#### Scenario: JSON output for multiple VM starts

- **GIVEN** the command `homelab proxmox vm start 100 101 --json` is executed
- **WHEN** both VMs start successfully
- **THEN** it SHALL return JSON object:
  ```json
  {
    "started": [
      {"vmid": 100, "name": "web-server", "node": "pve"},
      {"vmid": 101, "name": "db-server", "node": "pve"}
    ],
    "failed": []
  }
  ```

#### Scenario: JSON output with failures

- **GIVEN** the command `homelab proxmox vm start 100 999 --json` is executed
- **WHEN** VM 100 succeeds but VM 999 fails
- **THEN** it SHALL return JSON:
  ```json
  {
    "started": [
      {"vmid": 100, "name": "web-server", "node": "pve"}
    ],
    "failed": [
      {"vmid": 999, "error": "VM not found"}
    ]
  }
  ```
- **AND** exit with status code 1

#### Scenario: JSON mode disallows interactive selection

- **GIVEN** the command `homelab proxmox vm start --json` is executed (no VMIDs)
- **THEN** it SHALL display error "JSON mode requires explicit VM IDs"
- **AND** exit with status code 1
- **AND** NOT enter interactive mode

### Requirement: Command Help and Documentation

The command SHALL provide clear help text and examples.

#### Scenario: Command description and usage

- **GIVEN** the command static properties
- **THEN** the description SHALL be "Start one or more stopped Proxmox VMs"
- **AND** help text SHALL be accessible via `homelab proxmox vm start --help`
- **AND** examples SHALL demonstrate:
  - Starting single VM
  - Starting multiple VMs
  - Interactive selection mode
  - JSON output mode

### Requirement: Repository Interface Extension

The IProxmoxRepository interface SHALL be extended with the startVM method.

#### Scenario: Interface method signature

- **GIVEN** the IProxmoxRepository interface definition
- **THEN** it SHALL include method:
  ```typescript
  startVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>
  ```
- **AND** the method SHALL be implemented by ProxmoxApiRepository
- **AND** return a Result containing the task UPID or error

### Requirement: Error Handling and User Feedback

The command SHALL provide clear, actionable error messages.

#### Scenario: VM not found error message

- **GIVEN** user attempts to start non-existent VM 999
- **WHEN** the error is displayed
- **THEN** the message SHALL be "VM 999 not found. Use 'homelab proxmox vm list' to see available VMs."
- **AND** guide user to discover available VMs

#### Scenario: Network error message

- **GIVEN** Proxmox API is unreachable
- **WHEN** the command fails
- **THEN** the message SHALL indicate network connectivity issue
- **AND** suggest checking Proxmox host configuration

#### Scenario: Authentication error message

- **GIVEN** API token is invalid or expired
- **WHEN** the command fails with authentication error
- **THEN** the message SHALL indicate authentication failure
- **AND** suggest checking PROXMOX_TOKEN_SECRET environment variable

### Requirement: Sequential VM Start Operations

The command SHALL start VMs sequentially to avoid overwhelming the Proxmox API.

#### Scenario: Sequential start for multiple VMs

- **GIVEN** multiple VMs need to be started
- **WHEN** iterating through VMIDs
- **THEN** each VM SHALL be started with `await` in the loop
- **AND** progress SHALL be displayed for each VM
- **AND** prevent parallel API calls that could overwhelm Proxmox
- **AND** allow proper error tracking per VM

### Requirement: Testing Coverage

The implementation SHALL include comprehensive tests for all layers.

#### Scenario: Repository tests

- **THEN** tests SHALL verify successful API call to start endpoint
- **AND** verify proper error handling for API failures
- **AND** verify task UPID is returned correctly
- **AND** verify error context includes node and vmid

#### Scenario: Service tests

- **THEN** tests SHALL verify service finds VM node from listing
- **AND** verify service calls repository with correct parameters
- **AND** verify error wrapping from repository to service errors
- **AND** verify Result pattern used correctly

#### Scenario: Command tests

- **THEN** tests SHALL verify single VM start output
- **AND** verify multiple VM start with progress and summary
- **AND** verify interactive mode filters stopped VMs
- **AND** verify JSON output format
- **AND** verify error handling and exit codes

### Requirement: Command File Location and Structure

The command SHALL follow oclif conventions for file structure.

#### Scenario: Command file path

- **GIVEN** the oclif command structure
- **THEN** the command file SHALL be at `src/commands/proxmox/vm/start.ts`
- **AND** the class SHALL be named `ProxmoxVmStart`
- **AND** extend `BaseCommand<typeof ProxmoxVmStart>`
- **AND** compile to `dist/commands/proxmox/vm/start.js`
- **AND** create CLI command `homelab proxmox vm start`

#### Scenario: Test file location

- **GIVEN** the test directory structure
- **THEN** test file SHALL be at `test/commands/proxmox/vm/start.test.ts`
- **AND** mirror the source file structure
