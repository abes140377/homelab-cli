# proxmox-vm-cloudinit-configuration Specification

## Purpose
Enable configuration of cloud-init settings for Proxmox VMs through the homelab CLI, supporting user credentials, SSH keys, network configuration, and package upgrade behavior.

## ADDED Requirements

### Requirement: Cloud-Init Configuration DTO

The system SHALL provide a type-safe DTO for cloud-init configuration parameters.

#### Scenario: Create cloud-init configuration DTO

- **GIVEN** cloud-init parameters: user, password, SSH keys, IP config, and upgrade setting
- **WHEN** creating a CloudInitConfigDTO instance
- **THEN** it SHALL contain fields: user, password, sshKeys, ipconfig0, upgrade
- **AND** it SHALL be immutable (readonly fields)
- **AND** it SHALL be validated by CloudInitConfigSchema

#### Scenario: Validate cloud-init configuration with Zod

- **GIVEN** a CloudInitConfigDTO with valid parameters
- **WHEN** validating with CloudInitConfigSchema.parse()
- **THEN** validation SHALL succeed
- **AND** return parsed object matching CloudInitConfigDTO structure

### Requirement: IP Configuration Format Validation

The system SHALL validate IP configuration format for cloud-init network settings.

#### Scenario: Validate DHCP configuration

- **GIVEN** ipconfig0 value "dhcp"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept lowercase "dhcp" string

#### Scenario: Validate static IP without gateway

- **GIVEN** ipconfig0 value "ip=192.168.1.100/24"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept CIDR notation with valid IP and prefix length

#### Scenario: Validate static IP with gateway

- **GIVEN** ipconfig0 value "ip=10.0.10.123/24,gw=10.0.10.1"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept IP with CIDR notation followed by optional gateway

#### Scenario: Reject invalid IP configuration format

- **GIVEN** ipconfig0 value "invalid-format"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL fail
- **AND** error message SHALL indicate expected format: "dhcp" or "ip=X.X.X.X/YY[,gw=X.X.X.X]"

#### Scenario: Reject malformed static IP

- **GIVEN** ipconfig0 value "ip=999.999.999.999/99"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL fail
- **AND** reject invalid IP address octets or prefix length

### Requirement: Username Validation

The system SHALL validate username is non-empty for cloud-init configuration.

#### Scenario: Accept valid username

- **GIVEN** user value "admin"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept any non-empty string as username

#### Scenario: Reject empty username

- **GIVEN** user value ""
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL fail
- **AND** error message SHALL indicate "Username cannot be empty"

### Requirement: Password Validation

The system SHALL allow empty password values for SSH-key-only authentication.

#### Scenario: Accept empty password

- **GIVEN** password value ""
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** allow empty string (no password authentication)

#### Scenario: Accept non-empty password

- **GIVEN** password value "MySecurePassword123"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept any string as password

### Requirement: SSH Keys Validation

The system SHALL accept SSH public key content for cloud-init configuration.

#### Scenario: Accept valid SSH public key

- **GIVEN** sshKeys value "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey user@host"
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept any string as SSH keys (format validation done by Proxmox)

#### Scenario: Accept empty SSH keys

- **GIVEN** sshKeys value ""
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** allow empty string when password is set

### Requirement: Upgrade Setting Validation

The system SHALL validate upgrade setting as boolean for cloud-init configuration.

#### Scenario: Accept upgrade enabled

- **GIVEN** upgrade value true
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept boolean true

#### Scenario: Accept upgrade disabled

- **GIVEN** upgrade value false
- **WHEN** validating with CloudInitConfigSchema
- **THEN** validation SHALL succeed
- **AND** accept boolean false (default)

### Requirement: Repository VM Configuration Method

The IProxmoxRepository interface SHALL define a method to set VM configuration parameters.

#### Scenario: Repository interface defines setVMConfig

- **GIVEN** the IProxmoxRepository interface
- **THEN** it SHALL define method signature:
  ```typescript
  setVMConfig(
    node: string,
    vmid: number,
    config: Record<string, string | number | boolean>
  ): Promise<Result<void, RepositoryError>>
  ```
- **AND** method SHALL be implemented by ProxmoxApiRepository

### Requirement: Repository Cloud-Init Configuration

The repository SHALL configure cloud-init settings via Proxmox API using the proxmox-api package.

#### Scenario: Successfully set cloud-init configuration

- **GIVEN** a VM with VMID 100 on node "pve"
- **AND** cloud-init config with user="admin", password="", sshKeys="ssh-ed25519 AAAA...", ipconfig0="dhcp", upgrade=false
- **WHEN** `setVMConfig("pve", 100, config)` is called
- **THEN** it SHALL call Proxmox API endpoint `/nodes/pve/qemu/100/config` with PUT method
- **AND** it SHALL pass parameters: ciuser="admin", cipassword="", sshkeys=URL_ENCODED_KEY, ipconfig0="dhcp", ciupgrade=0
- **AND** it SHALL URL-encode the sshkeys parameter
- **AND** it SHALL convert upgrade boolean to integer (false→0, true→1)
- **AND** return Result with success: true

#### Scenario: Handle API error during configuration

- **GIVEN** a VM that does not exist
- **WHEN** `setVMConfig()` is called with invalid VMID
- **THEN** it SHALL catch the API error
- **AND** return Result with success: false
- **AND** error SHALL be RepositoryError with message "Failed to set VM configuration"
- **AND** error SHALL include API error as cause

#### Scenario: URL-encode SSH keys for API

- **GIVEN** SSH key with newline character "key1\nkey2"
- **WHEN** `setVMConfig()` prepares parameters
- **THEN** it SHALL URL-encode the sshkeys value
- **AND** newlines SHALL be encoded as %0A
- **AND** spaces SHALL be encoded as %20

### Requirement: Service Node Resolution

The service SHALL resolve the node name for a given VMID by querying cluster resources.

#### Scenario: Resolve node for existing VM

- **GIVEN** a VM with VMID 100 on node "pve"
- **WHEN** service resolves node for VMID 100
- **THEN** it SHALL call `repository.listResources('qemu')`
- **AND** it SHALL find VM with vmid === 100 in the results
- **AND** return node name "pve"

#### Scenario: Handle VMID not found

- **GIVEN** no VM with VMID 999 exists
- **WHEN** service attempts to resolve node for VMID 999
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError with message "VM 999 not found"

#### Scenario: Handle cluster query error

- **GIVEN** repository fails to query cluster resources
- **WHEN** service attempts to resolve node
- **THEN** it SHALL return Result with success: false
- **AND** error SHALL be ServiceError wrapping repository error

### Requirement: Service Cloud-Init Configuration Method

The ProxmoxVMService SHALL provide a method to configure cloud-init for a VM.

#### Scenario: Successfully configure cloud-init

- **GIVEN** a VM with VMID 100 on node "pve"
- **AND** valid CloudInitConfigDTO
- **WHEN** `configureCloudInit(100, config)` is called
- **THEN** service SHALL validate config with CloudInitConfigSchema
- **AND** service SHALL resolve node name from VMID
- **AND** service SHALL format parameters for API (URL-encode SSH keys, convert upgrade to integer)
- **AND** service SHALL call `repository.setVMConfig(node, vmid, apiParams)`
- **AND** return Result with success: true

#### Scenario: Handle validation failure

- **GIVEN** CloudInitConfigDTO with empty username
- **WHEN** `configureCloudInit()` validates the config
- **THEN** it SHALL fail Zod validation
- **AND** return Result with success: false
- **AND** error SHALL be ServiceError with validation error message

#### Scenario: Handle node resolution failure

- **GIVEN** VMID that does not exist
- **WHEN** `configureCloudInit()` attempts to resolve node
- **THEN** it SHALL receive failure from node resolution
- **AND** return Result with success: false
- **AND** error SHALL be ServiceError with "VM not found" message

#### Scenario: Handle repository configuration failure

- **GIVEN** valid config and node resolved
- **WHEN** repository.setVMConfig() fails
- **THEN** service SHALL return Result with success: false
- **AND** error SHALL be ServiceError wrapping repository error

### Requirement: Command Cloud-Init Interface

The CLI SHALL provide a command to configure cloud-init settings for a VM.

#### Scenario: Configure cloud-init with DHCP

- **GIVEN** the command `homelab proxmox vm cloudinit 100 --user admin --ssh-key ./keys/admin_id_ecdsa.pub --ipconfig dhcp`
- **WHEN** service successfully configures cloud-init
- **THEN** command SHALL display "Configuring cloud-init for VM 100..."
- **AND** display "Successfully configured cloud-init for VM 100"
- **AND** exit with status code 0

#### Scenario: Configure cloud-init with static IP

- **GIVEN** the command `homelab proxmox vm cloudinit 100 --ipconfig ip=192.168.1.100/24,gw=192.168.1.1`
- **WHEN** service successfully configures cloud-init
- **THEN** command SHALL pass ipconfig0="ip=192.168.1.100/24,gw=192.168.1.1" to service
- **AND** display success message
- **AND** exit with status code 0

#### Scenario: Configure cloud-init with upgrade enabled

- **GIVEN** the command `homelab proxmox vm cloudinit 100 --upgrade`
- **WHEN** service successfully configures cloud-init
- **THEN** command SHALL pass upgrade=true to service
- **AND** display success message

#### Scenario: Read SSH key from file path

- **GIVEN** the command with flag `--ssh-key ./keys/admin_id_ecdsa.pub`
- **AND** the file exists with content "ssh-ed25519 AAAA... user@host"
- **WHEN** command reads the SSH key
- **THEN** it SHALL read file content from filesystem
- **AND** pass SSH key content to service in CloudInitConfigDTO

#### Scenario: Handle SSH key file not found

- **GIVEN** the command with flag `--ssh-key ./nonexistent.pub`
- **AND** the file does not exist
- **WHEN** command attempts to read SSH key file
- **THEN** it SHALL catch filesystem error
- **AND** display error message "Failed to read SSH key file: ./nonexistent.pub"
- **AND** exit with status code 1

#### Scenario: Accept SSH key as direct content

- **GIVEN** the command with flag `--ssh-key "ssh-ed25519 AAAA... user@host"`
- **AND** the value is not a file path (does not start with ./ or /)
- **WHEN** command processes SSH key
- **THEN** it SHALL treat value as direct SSH key content
- **AND** pass value directly to service without reading filesystem

#### Scenario: Use default values

- **GIVEN** the command `homelab proxmox vm cloudinit 100`
- **WHEN** command processes flags
- **THEN** it SHALL use default user="admin"
- **AND** use default password=""
- **AND** use default ssh-key="./keys/admin_id_ecdsa.pub"
- **AND** use default upgrade=false
- **AND** use default ipconfig="dhcp"

#### Scenario: Display validation error

- **GIVEN** the command with invalid IP config `--ipconfig invalid`
- **WHEN** service returns validation error
- **THEN** command SHALL display "Failed to configure cloud-init: {validation error message}"
- **AND** exit with status code 1

#### Scenario: Display VM not found error

- **GIVEN** the command `homelab proxmox vm cloudinit 999`
- **WHEN** service returns "VM 999 not found" error
- **THEN** command SHALL display "Failed to configure cloud-init: VM 999 not found"
- **AND** exit with status code 1

#### Scenario: Require VMID argument

- **GIVEN** the command `homelab proxmox vm cloudinit` without VMID
- **WHEN** oclif parses arguments
- **THEN** it SHALL display usage error "Missing required argument vmid"
- **AND** display command help
- **AND** exit with status code 2

### Requirement: Command File Structure

The cloudinit command SHALL follow oclif conventions and project structure patterns.

#### Scenario: Command file location

- **GIVEN** the oclif command structure
- **THEN** the command file SHALL be located at `src/commands/proxmox/vm/cloudinit.ts`
- **AND** the class SHALL be named `ProxmoxVmCloudinit`
- **AND** extend `BaseCommand<typeof ProxmoxVmCloudinit>`
- **AND** this SHALL create the CLI command path `homelab proxmox vm cloudinit`

#### Scenario: Command defines required VMID argument

- **GIVEN** the ProxmoxVmCloudinit command class
- **THEN** it SHALL define static args property with vmid as required integer argument

#### Scenario: Command defines cloud-init flags

- **GIVEN** the ProxmoxVmCloudinit command class
- **THEN** it SHALL define static flags property with: user, password, ssh-key, upgrade, ipconfig
- **AND** each flag SHALL have appropriate description and default value

#### Scenario: Command uses factory for service

- **GIVEN** the command implementation
- **WHEN** obtaining service instance
- **THEN** it SHALL use `ProxmoxVMFactory.createProxmoxVMService()`
- **AND** NOT instantiate repository or service directly

### Requirement: Command Help and Examples

The command SHALL provide clear documentation and examples.

#### Scenario: Command description

- **GIVEN** the command static properties
- **THEN** the `description` property SHALL state: "Configure cloud-init settings for a Proxmox VM"
- **AND** help text SHALL be accessible via `homelab proxmox vm cloudinit --help`

#### Scenario: Command examples

- **GIVEN** the command static `examples` property
- **THEN** it SHALL include example: `homelab proxmox vm cloudinit 100` (DHCP with defaults)
- **AND** include example: `homelab proxmox vm cloudinit 100 --ipconfig ip=192.168.1.100/24`
- **AND** include example: `homelab proxmox vm cloudinit 100 --ipconfig ip=10.0.10.123/24,gw=10.0.10.1 --upgrade`
- **AND** include example showing SSH key from file

### Requirement: Testing Coverage

The cloud-init configuration capability SHALL have comprehensive test coverage.

#### Scenario: Repository tests cover setVMConfig

- **GIVEN** repository test file at `test/repositories/proxmox-api.repository.test.ts`
- **THEN** it SHALL test `setVMConfig()` success case
- **AND** test URL-encoding of SSH keys
- **AND** test conversion of upgrade boolean to integer
- **AND** test API error handling
- **AND** use mock proxmox-api client responses

#### Scenario: Service tests cover configureCloudInit

- **GIVEN** service test file at `test/services/proxmox-vm.service.test.ts`
- **THEN** it SHALL test `configureCloudInit()` happy path
- **AND** test Zod validation failure scenarios
- **AND** test node resolution failure
- **AND** test repository error handling
- **AND** use mock repository via interface

#### Scenario: Command tests verify user interaction

- **GIVEN** command test file at `test/commands/proxmox/vm/cloudinit.test.ts`
- **THEN** it SHALL use `runCommand()` from `@oclif/test`
- **AND** test successful configuration with DHCP
- **AND** test successful configuration with static IP
- **AND** test SSH key file reading
- **AND** test SSH key as direct content
- **AND** test validation error display
- **AND** test VM not found error display
- **AND** verify exit codes for success and failure

### Requirement: Error Message Clarity

All error messages SHALL provide clear, actionable information to users.

#### Scenario: Invalid IP format provides helpful message

- **GIVEN** user provides invalid ipconfig "ip=invalid"
- **WHEN** validation fails
- **THEN** error message SHALL be "Must be 'dhcp' or 'ip=X.X.X.X/YY[,gw=X.X.X.X]'"
- **AND** indicate expected format clearly

#### Scenario: VM not found provides context

- **GIVEN** VMID does not exist
- **WHEN** node resolution fails
- **THEN** error message SHALL be "VM {vmid} not found"
- **AND** suggest running `homelab proxmox vm list` to see available VMs

#### Scenario: SSH key file not found provides path

- **GIVEN** SSH key file path does not exist
- **WHEN** command attempts to read file
- **THEN** error message SHALL include the file path attempted
- **AND** message format: "Failed to read SSH key file: {path}"

#### Scenario: API connection error provides context

- **GIVEN** Proxmox API is unreachable
- **WHEN** repository operation fails with network error
- **THEN** error message SHALL include "Failed to connect to Proxmox API"
- **AND** include original error message for debugging

### Requirement: proxmox-api Package Integration

The repository SHALL use the proxmox-api package methods correctly for cloud-init configuration.

#### Scenario: Set config API call uses correct path structure

- **GIVEN** VM on node "pve" with VMID 100
- **WHEN** constructing API call to set config
- **THEN** it SHALL use: `proxmox.nodes.$("pve").qemu.$(100).config.$put({...})`
- **AND** follow package pattern: nodes.$(node).qemu.$(vmid).config.$put()

#### Scenario: Cloud-init parameters use correct API field names

- **GIVEN** cloud-init configuration parameters
- **WHEN** constructing API request body
- **THEN** it SHALL use field names: ciuser, cipassword, sshkeys, ipconfig0, ciupgrade
- **AND** match Proxmox API documentation exactly

#### Scenario: SSH keys require URL encoding

- **GIVEN** SSH key with special characters or newlines
- **WHEN** preparing API request
- **THEN** it SHALL URL-encode the sshkeys parameter value
- **AND** use `encodeURIComponent()` function

#### Scenario: Upgrade boolean converts to integer

- **GIVEN** upgrade=true or upgrade=false
- **WHEN** preparing API request
- **THEN** it SHALL convert to ciupgrade=1 or ciupgrade=0
- **AND** Proxmox API expects integer, not boolean
