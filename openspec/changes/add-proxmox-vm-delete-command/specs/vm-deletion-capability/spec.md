# vm-deletion-capability Specification

## ADDED Requirements

### Requirement: Proxmox VM Deletion Repository Interface

The IProxmoxRepository interface SHALL define a method for deleting VMs.

#### Scenario: Repository interface includes deleteVM method

- **GIVEN** the repository interface `IProxmoxRepository`
- **THEN** it SHALL define method `deleteVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>`
- **AND** the method SHALL return a Result containing the task UPID on success
- **AND** the method SHALL be implemented by all Proxmox repository implementations

### Requirement: Proxmox API VM Deletion

The ProxmoxApiRepository SHALL implement VM deletion via the Proxmox API DELETE endpoint.

#### Scenario: Delete VM via Proxmox API

- **GIVEN** a VM with vmid 100 on node 'pve'
- **WHEN** `deleteVM('pve', 100)` is called
- **THEN** it SHALL call `DELETE /nodes/pve/qemu/100` via the Proxmox API
- **AND** return Result containing the task UPID string on success
- **AND** log debug information when debug logging is enabled

#### Scenario: Handle VM not found error

- **GIVEN** a non-existent VM with vmid 999
- **WHEN** `deleteVM('pve', 999)` is called
- **THEN** it SHALL return a failure Result
- **AND** the error SHALL be a RepositoryError with message indicating VM not found
- **AND** log debug error information when debug logging is enabled

#### Scenario: Handle API permission errors

- **GIVEN** insufficient permissions to delete a VM
- **WHEN** `deleteVM(node, vmid)` is called
- **THEN** it SHALL return a failure Result
- **AND** the error SHALL be a RepositoryError with message indicating permission denied
- **AND** NOT expose sensitive authentication details in the error

#### Scenario: Handle VM deletion task creation

- **GIVEN** a successful VM deletion API call
- **WHEN** the Proxmox API returns a task UPID
- **THEN** the repository SHALL return success Result with the UPID
- **AND** NOT wait for task completion (async operation)
- **AND** allow the service layer to optionally wait for completion

### Requirement: VM Deletion Service Layer

The ProxmoxVMService SHALL provide business logic for VM deletion with validation.

#### Scenario: Delete VM with node lookup

- **GIVEN** a VM with vmid 100 exists on node 'pve'
- **WHEN** the service `deleteVM(100)` is called
- **THEN** it SHALL first list VMs to find which node the VM is on
- **AND** call the repository `deleteVM(node, 100)` with the correct node
- **AND** return Result<{vmid: number, node: string, upid: string}, ServiceError> on success

#### Scenario: Delete VM that doesn't exist

- **GIVEN** a VM with vmid 999 does not exist
- **WHEN** the service `deleteVM(999)` is called
- **THEN** it SHALL return a failure Result
- **AND** the error SHALL be a ServiceError with message "VM {vmid} not found"
- **AND** NOT call the repository deleteVM method

#### Scenario: Wait for deletion task completion

- **GIVEN** a VM deletion has been initiated with UPID
- **WHEN** the service calls repository `waitForTask(node, upid)`
- **THEN** it SHALL poll the task status until completion
- **AND** return success Result if task completes successfully
- **AND** return failure Result if task fails or times out
- **AND** use existing waitForTask implementation from repository

### Requirement: VM Deletion Command

The CLI SHALL provide a command to delete one or more VMs by VMID.

#### Scenario: Delete single VM by VMID

- **GIVEN** the command `homelab proxmox vm delete 100` is executed
- **WHEN** the VM exists and user confirms deletion
- **THEN** the command SHALL display VM details (VMID, Name, Node, Status)
- **AND** prompt for confirmation with message "Are you sure you want to delete this VM? This action cannot be undone."
- **AND** invoke `ProxmoxVMService.deleteVM(100)` if confirmed
- **AND** wait for task completion
- **AND** display success message "Successfully deleted VM 100 '{name}' from node '{node}'"
- **AND** exit with status code 0

#### Scenario: Delete multiple VMs by VMID

- **GIVEN** the command `homelab proxmox vm delete 100 101 102` is executed
- **WHEN** all VMs exist and user confirms deletion
- **THEN** the command SHALL display details for all VMs in a table
- **AND** prompt for confirmation once for all VMs
- **AND** delete each VM sequentially
- **AND** display progress for each deletion
- **AND** display summary of successful and failed deletions
- **AND** exit with status code 0 if all succeed, code 1 if any fail

#### Scenario: User cancels deletion

- **GIVEN** the command `homelab proxmox vm delete 100` is executed
- **WHEN** the user chooses "No" at the confirmation prompt
- **THEN** the command SHALL display "Deletion cancelled"
- **AND** NOT call the service deleteVM method
- **AND** exit with status code 0

#### Scenario: Delete VM with force flag

- **GIVEN** the command `homelab proxmox vm delete 100 --force` is executed
- **WHEN** the VM exists
- **THEN** the command SHALL NOT display confirmation prompt
- **AND** immediately invoke `ProxmoxVMService.deleteVM(100)`
- **AND** display success message without user interaction

#### Scenario: Delete VM that doesn't exist

- **GIVEN** the command `homelab proxmox vm delete 999` is executed
- **WHEN** VM 999 does not exist
- **THEN** the command SHALL display error "VM 999 not found"
- **AND** NOT display confirmation prompt
- **AND** exit with status code 1

#### Scenario: Interactive VM selection for deletion

- **GIVEN** the command `homelab proxmox vm delete` is executed without VMID arguments
- **WHEN** VMs are available in the Proxmox environment
- **THEN** the command SHALL list all VMs with details (VMID, Name, Node, Status)
- **AND** prompt user to select one or more VMs using `promptForMultipleSelections`
- **AND** display selected VMs and prompt for final confirmation
- **AND** proceed with deletion if confirmed

#### Scenario: Interactive mode with no VMs available

- **GIVEN** the command `homelab proxmox vm delete` is executed without VMID arguments
- **WHEN** no VMs exist in the Proxmox environment
- **THEN** the command SHALL display "No VMs available to delete"
- **AND** exit with status code 0

#### Scenario: Delete VM with JSON output

- **GIVEN** the command `homelab proxmox vm delete 100 --json --force` is executed
- **WHEN** the deletion succeeds
- **THEN** the command SHALL return JSON: `{"vmid": 100, "name": "vm-name", "node": "pve", "status": "deleted"}`
- **AND** NOT display progress messages or prompts
- **AND** exit with status code 0

#### Scenario: Delete VM with JSON output on error

- **GIVEN** the command `homelab proxmox vm delete 999 --json` is executed
- **WHEN** the VM does not exist
- **THEN** the command SHALL return JSON: `{"error": "VM 999 not found"}`
- **AND** exit with status code 1

### Requirement: Command Argument Validation

The delete command SHALL validate arguments and provide helpful error messages.

#### Scenario: Validate VMID format

- **GIVEN** the command `homelab proxmox vm delete abc` is executed
- **WHEN** parsing arguments
- **THEN** oclif SHALL display error "Expected an integer but received: abc"
- **AND** exit with status code 2 (validation error)

#### Scenario: Require at least one VMID or interactive mode

- **GIVEN** the command is designed to accept optional VMID arguments
- **WHEN** no VMIDs are provided
- **THEN** the command SHALL enter interactive selection mode
- **AND** NOT display a validation error

### Requirement: Command Integration with Architecture

The VM deletion command SHALL follow the established layered architecture pattern.

#### Scenario: Use factory for dependency injection

- **GIVEN** the delete command implementation
- **WHEN** the command needs a service instance
- **THEN** it SHALL use `ProxmoxVMFactory.createProxmoxVMService()`
- **AND** NOT create repository or service instances directly

#### Scenario: Extend BaseCommand class

- **GIVEN** the delete command class definition
- **THEN** it SHALL extend `BaseCommand<typeof ProxmoxVmDelete>`
- **AND** implement the `async run(): Promise<void | DeleteResult>` method
- **AND** define static `description` property
- **AND** define static `examples` property
- **AND** define static `args` property for variadic VMID arguments
- **AND** define static `flags` property for `--force` flag

#### Scenario: Handle Result pattern correctly

- **GIVEN** the service returns a `Result<DeletedVM, ServiceError>`
- **WHEN** the command processes the result
- **THEN** it SHALL check `result.success` to determine success or failure
- **AND** call `this.error()` for failure cases (exits with code 1)
- **AND** access `result.data` only when `result.success === true`

### Requirement: Testing Coverage

The VM deletion feature SHALL have comprehensive test coverage across all layers.

#### Scenario: Repository tests for VM deletion

- **WHEN** repository tests are executed
- **THEN** they SHALL verify successful VM deletion returns UPID
- **AND** verify handling of non-existent VM errors
- **AND** verify handling of permission errors
- **AND** verify correct API endpoint construction
- **AND** verify debug logging when enabled

#### Scenario: Service tests for VM deletion

- **WHEN** service tests are executed
- **THEN** they SHALL test successful VM deletion with node lookup
- **AND** test error handling for non-existent VMs
- **AND** test task waiting functionality
- **AND** verify ServiceError wrapping of RepositoryErrors

#### Scenario: Command tests for VM deletion

- **WHEN** command tests are executed
- **THEN** they SHALL test single VM deletion with confirmation
- **AND** test multiple VM deletion
- **AND** test force flag skipping confirmation
- **AND** test interactive selection mode
- **AND** test JSON output mode
- **AND** test error scenarios (VM not found, permission denied)
- **AND** test user cancellation handling

### Requirement: Documentation and Help Text

The delete command SHALL provide clear documentation and help text.

#### Scenario: Command description and help

- **GIVEN** the command static properties
- **THEN** the `description` property SHALL state: "Delete one or more Proxmox VMs"
- **AND** help text SHALL warn: "WARNING: This action cannot be undone. Deleted VMs and their data will be permanently removed."
- **AND** be accessible via `homelab proxmox vm delete --help`

#### Scenario: Command examples

- **GIVEN** the command static `examples` property
- **THEN** it SHALL include example: `homelab proxmox vm delete 100`
- **AND** include example: `homelab proxmox vm delete 100 101 102`
- **AND** include example: `homelab proxmox vm delete 100 --force`
- **AND** include example: `homelab proxmox vm delete --json --force 100`
- **AND** include example showing interactive mode: `homelab proxmox vm delete`

### Requirement: Safety and User Experience

The delete command SHALL prioritize safety and clear communication.

#### Scenario: Display VM details before confirmation

- **GIVEN** user is about to delete VM(s)
- **WHEN** confirmation prompt is displayed
- **THEN** it SHALL show VMID, Name, Node, and Status for each VM
- **AND** use a table format for clarity
- **AND** display warning message in the prompt

#### Scenario: Clear success and error messages

- **GIVEN** any deletion operation
- **WHEN** displaying results to the user
- **THEN** success messages SHALL include VM name and node
- **AND** error messages SHALL be actionable (e.g., "VM 100 not found. Use 'homelab proxmox vm list' to see available VMs")
- **AND** NOT expose internal stack traces or sensitive data

#### Scenario: Progress indication for multiple deletions

- **GIVEN** deleting multiple VMs
- **WHEN** each deletion completes
- **THEN** it SHALL display progress (e.g., "Deleting VM 1/3...")
- **AND** show individual results for each VM
- **AND** provide final summary of successes and failures
