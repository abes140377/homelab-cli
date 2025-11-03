# VM Creation Capability Spec

## Purpose
Enable creation of Proxmox QEMU virtual machines from templates via CLI command with automatic template name resolution and VMID allocation.

## ADDED Requirements

### Requirement: Repository VMID Allocation

The Proxmox repository SHALL provide a method to find the next available VMID in the cluster.

#### Scenario: Find next available VMID with gaps

- **GIVEN** the Proxmox cluster has VMs with VMIDs [100, 101, 103, 105]
- **WHEN** `getNextAvailableVmid()` is called
- **THEN** it SHALL return Result with success and data: 102
- **AND** it SHALL search starting from VMID 100
- **AND** it SHALL find the first gap in the sequence

#### Scenario: Find next available VMID without gaps

- **GIVEN** the Proxmox cluster has VMs with VMIDs [100, 101, 102, 103]
- **WHEN** `getNextAvailableVmid()` is called
- **THEN** it SHALL return Result with success and data: 104
- **AND** it SHALL return the next sequential VMID after the highest existing VMID

#### Scenario: Find first VMID when cluster is empty

- **GIVEN** the Proxmox cluster has no VMs or templates
- **WHEN** `getNextAvailableVmid()` is called
- **THEN** it SHALL return Result with success and data: 100
- **AND** it SHALL use 100 as the minimum VMID per Proxmox conventions

#### Scenario: Handle API error during VMID lookup

- **GIVEN** the Proxmox API fails to return cluster resources
- **WHEN** `getNextAvailableVmid()` is called
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be RepositoryError with message "Failed to fetch cluster resources for VMID allocation"
- **AND** error SHALL include the API error as cause

### Requirement: Repository VM Clone Operation

The Proxmox repository SHALL provide a method to clone a template VM to create a new VM using full clone mode.

#### Scenario: Successfully clone template

- **GIVEN** a template with VMID 100 on node "pve"
- **AND** a target VMID 200 and name "my-server"
- **WHEN** `cloneFromTemplate("pve", 100, 200, "my-server")` is called
- **THEN** it SHALL call the Proxmox API endpoint `/nodes/pve/qemu/100/clone`
- **AND** it SHALL use POST method with parameters: newid=200, name="my-server", full=1
- **AND** it SHALL return Result with success: true
- **AND** data SHALL be the task UPID string

#### Scenario: Handle clone API error

- **GIVEN** a template VMID that does not exist
- **WHEN** `cloneFromTemplate()` is called
- **THEN** it SHALL catch the API error
- **AND** return Result with success: false
- **AND** error SHALL be RepositoryError with message "Failed to clone VM from template"
- **AND** error SHALL include the API error as cause

#### Scenario: Clone uses full clone mode

- **GIVEN** any template clone operation
- **WHEN** `cloneFromTemplate()` constructs the API request
- **THEN** it SHALL include parameter `full: 1`
- **AND** it SHALL NOT use linked clone mode
- **AND** the new VM SHALL be independent of the template

### Requirement: Repository Task Polling

The Proxmox repository SHALL provide a method to wait for a Proxmox task to complete with timeout support.

#### Scenario: Wait for successful task completion

- **GIVEN** a task UPID "UPID:pve:00001234:00000000:12345678:qmclone:100:root@pam:"
- **AND** the task completes successfully within timeout
- **WHEN** `waitForTask("pve", upid)` is called
- **THEN** it SHALL poll the task status endpoint `/nodes/pve/tasks/{upid}/status`
- **AND** it SHALL poll every 2 seconds until status is not "running"
- **AND** it SHALL return Result with success: true when task exitstatus is "OK"

#### Scenario: Handle task failure

- **GIVEN** a task that fails with exitstatus error
- **WHEN** `waitForTask()` polls the task
- **AND** task status shows stopped with non-OK exitstatus
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be RepositoryError with message "Task failed: {exitstatus}"

#### Scenario: Handle task timeout

- **GIVEN** a long-running task that does not complete
- **WHEN** `waitForTask("pve", upid, 10000)` is called with 10 second timeout
- **AND** the task is still running after 10 seconds
- **THEN** it SHALL stop polling
- **AND** return Result with success: false
- **AND** error SHALL be RepositoryError with message "Task timed out after 10000ms"

#### Scenario: Default timeout is 5 minutes

- **GIVEN** `waitForTask("pve", upid)` is called without timeout parameter
- **WHEN** evaluating the timeout duration
- **THEN** it SHALL use 300000 milliseconds (5 minutes) as default timeout

#### Scenario: Handle API error during polling

- **GIVEN** a task UPID
- **WHEN** the API request to get task status fails
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be RepositoryError with message "Failed to poll task status"
- **AND** error SHALL include the API error as cause

### Requirement: Service Template Name Resolution

The Proxmox VM service SHALL resolve template names to template DTOs for VM creation operations.

#### Scenario: Resolve template by exact name match

- **GIVEN** templates with names ["ubuntu-22.04", "debian-12", "centos-9"]
- **WHEN** resolving template name "ubuntu-22.04"
- **THEN** it SHALL call `repository.listTemplates()`
- **AND** it SHALL find the template with exact name match
- **AND** return the matching ProxmoxTemplateDTO with vmid and node information

#### Scenario: Handle template not found

- **GIVEN** templates with names ["ubuntu-22.04", "debian-12"]
- **WHEN** resolving template name "windows-11"
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError with message "Template 'windows-11' not found"

#### Scenario: Use first match when multiple templates have same name

- **GIVEN** templates with names ["ubuntu-22.04", "ubuntu-22.04", "debian-12"]
- **WHEN** resolving template name "ubuntu-22.04"
- **THEN** it SHALL return the first matching template
- **AND** document this behavior in command help text

#### Scenario: Template name matching is case-sensitive

- **GIVEN** a template with name "Ubuntu-22.04"
- **WHEN** resolving template name "ubuntu-22.04"
- **THEN** it SHALL NOT match
- **AND** return template not found error

### Requirement: Service VM Creation Orchestration

The Proxmox VM service SHALL orchestrate the complete VM creation workflow from template name to created VM.

#### Scenario: Successfully create VM from template

- **GIVEN** a template named "ubuntu-22.04" with VMID 100 on node "pve"
- **AND** next available VMID is 200
- **WHEN** `createVmFromTemplate("my-server", "ubuntu-22.04")` is called
- **THEN** it SHALL resolve template name to template DTO
- **AND** it SHALL allocate next available VMID
- **AND** it SHALL clone template using repository.cloneFromTemplate(node, templateVmid, newVmid, vmName)
- **AND** it SHALL wait for clone task to complete
- **AND** return Result with success: true and data: {vmid: 200, name: "my-server", node: "pve"}

#### Scenario: Handle template resolution failure

- **GIVEN** template name "nonexistent" does not exist
- **WHEN** `createVmFromTemplate("my-server", "nonexistent")` is called
- **THEN** it SHALL attempt template resolution
- **AND** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError "Template 'nonexistent' not found"
- **AND** it SHALL NOT attempt VMID allocation or cloning

#### Scenario: Handle VMID allocation failure

- **GIVEN** VMID allocation fails
- **WHEN** `createVmFromTemplate()` calls getNextAvailableVmid()
- **AND** repository returns failure
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError wrapping the repository error
- **AND** it SHALL NOT attempt cloning

#### Scenario: Handle clone operation failure

- **GIVEN** template resolution and VMID allocation succeed
- **WHEN** repository.cloneFromTemplate() fails
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError with message "Failed to create VM: {repository error}"
- **AND** it SHALL NOT attempt task waiting

#### Scenario: Handle task wait timeout

- **GIVEN** clone operation returns task UPID
- **WHEN** repository.waitForTask() times out
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError with message "VM creation timed out"
- **AND** include context that task may still be running in background

### Requirement: Command VM Creation Interface

The CLI SHALL provide a command to create VMs from templates with user-friendly argument interface.

#### Scenario: Create VM with valid arguments

- **GIVEN** the command `homelab proxmox vm create my-server ubuntu-22.04` is executed
- **WHEN** service successfully creates VM with VMID 200 on node "pve"
- **THEN** the command SHALL display "Creating VM 'my-server' from template 'ubuntu-22.04'..."
- **AND** display "Successfully created VM 200 'my-server' on node 'pve'"
- **AND** exit with status code 0

#### Scenario: Display clear error for template not found

- **GIVEN** the command `homelab proxmox vm create my-server nonexistent` is executed
- **WHEN** service returns template not found error
- **THEN** the command SHALL display "Failed to create VM: Template 'nonexistent' not found"
- **AND** exit with status code 1

#### Scenario: Display clear error for creation failure

- **GIVEN** the command is executed
- **WHEN** service returns any failure (VMID allocation, clone, timeout)
- **THEN** the command SHALL display "Failed to create VM: {error.message}"
- **AND** exit with status code 1
- **AND** NOT display success message

#### Scenario: Require both arguments

- **GIVEN** the command `homelab proxmox vm create my-server` is executed without template name
- **WHEN** oclif parses arguments
- **THEN** it SHALL display usage error "Missing required argument template-name"
- **AND** display command help
- **AND** exit with status code 2

#### Scenario: Command provides usage examples

- **GIVEN** the command help is requested via `--help`
- **WHEN** displaying help text
- **THEN** it SHALL include description "Create a new VM from a template"
- **AND** include example: `homelab proxmox vm create my-server ubuntu-22.04`
- **AND** include example output showing success message

### Requirement: Repository Interface Extension

The IProxmoxRepository interface SHALL be extended with new methods for VM creation operations.

#### Scenario: Interface defines VMID allocation method

- **GIVEN** the IProxmoxRepository interface
- **THEN** it SHALL define method signature:
  ```typescript
  getNextAvailableVmid(): Promise<Result<number, RepositoryError>>
  ```
- **AND** method SHALL be implemented by ProxmoxApiRepository

#### Scenario: Interface defines clone method

- **GIVEN** the IProxmoxRepository interface
- **THEN** it SHALL define method signature:
  ```typescript
  cloneFromTemplate(
    node: string,
    templateVmid: number,
    newVmid: number,
    vmName: string,
  ): Promise<Result<string, RepositoryError>>
  ```
- **AND** method SHALL return task UPID as string in Result data

#### Scenario: Interface defines task wait method

- **GIVEN** the IProxmoxRepository interface
- **THEN** it SHALL define method signature:
  ```typescript
  waitForTask(
    node: string,
    upid: string,
    timeoutMs?: number,
  ): Promise<Result<void, RepositoryError>>
  ```
- **AND** timeoutMs parameter SHALL be optional with default 300000

### Requirement: Command File Structure

The create command SHALL follow oclif conventions and project structure patterns.

#### Scenario: Command file location

- **GIVEN** the oclif command structure
- **THEN** the command file SHALL be located at `src/commands/proxmox/vm/create.ts`
- **AND** the class SHALL be named `ProxmoxVmCreate`
- **AND** extend `BaseCommand<typeof ProxmoxVmCreate>`
- **AND** this SHALL create the CLI command path `homelab proxmox vm create`

#### Scenario: Command defines required arguments

- **GIVEN** the ProxmoxVmCreate command class
- **THEN** it SHALL define static args property:
  ```typescript
  static args = {
    'vm-name': Args.string({
      description: 'Name for the new VM',
      required: true,
    }),
    'template-name': Args.string({
      description: 'Name of the template to clone from',
      required: true,
    }),
  }
  ```

#### Scenario: Command uses factory for service

- **GIVEN** the command implementation
- **WHEN** obtaining service instance
- **THEN** it SHALL use `ProxmoxVMFactory.createProxmoxVMService()`
- **AND** NOT instantiate repository or service directly

### Requirement: Testing Coverage

The VM creation capability SHALL have comprehensive test coverage across all layers.

#### Scenario: Repository tests cover all methods

- **GIVEN** repository test file at `test/repositories/proxmox-api.repository.test.ts`
- **THEN** it SHALL test `getNextAvailableVmid()` with: empty cluster, gaps, no gaps
- **AND** it SHALL test `cloneFromTemplate()` success and error cases
- **AND** it SHALL test `waitForTask()` success, failure, timeout, default timeout
- **AND** use mock proxmox-api client responses

#### Scenario: Service tests cover orchestration

- **GIVEN** service test file at `test/services/proxmox-vm.service.test.ts`
- **THEN** it SHALL test `createVmFromTemplate()` happy path
- **AND** test template not found error
- **AND** test VMID allocation failure
- **AND** test clone failure
- **AND** test task wait timeout
- **AND** use mock repository via interface

#### Scenario: Command tests verify user interaction

- **GIVEN** command test file at `test/commands/proxmox/vm/create.test.ts`
- **THEN** it SHALL use `runCommand()` from `@oclif/test`
- **AND** test successful creation output
- **AND** test template not found error message
- **AND** test missing argument handling
- **AND** verify exit codes for success and failure

### Requirement: Error Message Clarity

All error messages SHALL provide clear, actionable information to users.

#### Scenario: Template not found provides helpful message

- **GIVEN** user requests template "windwos-11" (typo)
- **WHEN** template resolution fails
- **THEN** error message SHALL be "Template 'windwos-11' not found"
- **AND** suggest running `homelab proxmox template list` to see available templates

#### Scenario: API connection error provides context

- **GIVEN** Proxmox API is unreachable
- **WHEN** any repository operation fails with network error
- **THEN** error message SHALL include "Failed to connect to Proxmox API"
- **AND** include original error message for debugging

#### Scenario: Timeout provides clear explanation

- **GIVEN** clone task exceeds 5 minute timeout
- **WHEN** waitForTask() times out
- **THEN** error message SHALL be "VM creation timed out after 300000ms"
- **AND** explain that task may still be running in Proxmox
- **AND** suggest checking Proxmox web UI for task status

### Requirement: proxmox-api Package Integration

The repository SHALL use the proxmox-api npm package methods correctly following package conventions.

#### Scenario: Clone API call uses correct path structure

- **GIVEN** template on node "pve" with VMID 100
- **WHEN** constructing clone API call
- **THEN** it SHALL use: `proxmox.nodes.$("pve").qemu.$(100).clone.$post({...})`
- **AND** follow package pattern: replace `/` with `.`, `{param}` with `$(param)`, append `.$post()`

#### Scenario: Task status API call uses correct path

- **GIVEN** task UPID on node "pve"
- **WHEN** polling task status
- **THEN** it SHALL use: `proxmox.nodes.$("pve").tasks.$(upid).status.$get()`
- **AND** parse response for `status` and `exitstatus` fields

#### Scenario: Cluster resources API call for VMID allocation

- **GIVEN** need to fetch all VMIDs
- **WHEN** calling API for VMID allocation
- **THEN** it SHALL use: `proxmox.cluster.resources.$get({type: 'vm'})`
- **AND** parse response array for `vmid` field
- **AND** collect all VMIDs from both VMs and templates
