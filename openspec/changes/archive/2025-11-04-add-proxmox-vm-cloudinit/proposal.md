# Proposal: add-proxmox-vm-cloudinit

## Status
DRAFT

## Summary
Add a new command `homelab proxmox vm cloudinit <vmid>` to configure cloud-init settings for Proxmox VMs. This command will allow setting user credentials, SSH keys, network configuration, and package upgrade behavior using the Proxmox API.

## Motivation
Currently, after creating a VM from a template using `homelab proxmox vm create`, users must manually configure cloud-init settings through the Proxmox web UI or CLI. This manual step interrupts the automation workflow and makes it difficult to provision VMs in a reproducible manner. By providing a CLI command to configure cloud-init, users can script the entire VM provisioning process from template clone to fully configured VM ready for deployment.

## Goals
- Provide a CLI command to configure cloud-init settings for existing VMs
- Support essential cloud-init parameters: user, password, SSH keys, IP configuration, and upgrade settings
- Follow the established layered architecture pattern (Command → Service → Repository)
- Provide sensible defaults for common use cases
- Validate input parameters before sending to Proxmox API
- Support both DHCP and static IP configuration with optional gateway

## Non-Goals
- IPv6 configuration (not used in the target homelab environment)
- Custom cloud-init snippets (cicustom parameter)
- Multiple network interfaces (only eth0/ipconfig0 for now)
- Modifying cloud-init settings during VM creation (separate concern)

## Proposed Solution
Implement a new command following the existing architecture:

1. **Command Layer** (`src/commands/proxmox/vm/cloudinit.ts`):
   - Accept `vmid` as required argument
   - Accept flags for cloud-init parameters with sensible defaults
   - Validate and format parameters before passing to service
   - Display clear success/error messages

2. **Service Layer** (`src/services/proxmox-vm.service.ts`):
   - Add `configureCloudInit()` method to existing ProxmoxVMService
   - Validate cloud-init parameters using Zod schemas
   - Orchestrate repository call with proper error handling
   - Return Result type for consistent error flow

3. **Repository Layer** (`src/repositories/proxmox-api.repository.ts`):
   - Add `setVMConfig()` method to IProxmoxRepository interface
   - Implement method using proxmox-api package
   - Call PUT endpoint: `/nodes/{node}/qemu/{vmid}/config`
   - Handle API errors and return Result type

4. **Model Layer** (`src/models/`):
   - Create CloudInitConfigDTO for type-safe parameter passing
   - Create Zod schemas for validation of cloud-init parameters
   - Validate IP configuration format (DHCP vs static)

## Dependencies
- Requires proxmox-api npm package (already installed)
- Requires Node.js fs module to read default SSH key file
- No new external dependencies needed

## Risks and Mitigations
- **Risk**: Invalid IP configuration could break VM networking
  - **Mitigation**: Validate IP format with Zod schema before sending to API

- **Risk**: Reading SSH key file could fail if path is incorrect
  - **Mitigation**: Use default path relative to project root, provide clear error if file not found

- **Risk**: VM must exist for cloud-init configuration to succeed
  - **Mitigation**: Proxmox API will return error if VMID doesn't exist, command will display clear error message

## Alternatives Considered
1. **Combine with VM creation command**: Rejected because it conflates two distinct operations and reduces flexibility
2. **Support multiple network interfaces**: Deferred to future enhancement, current scope focuses on single interface (eth0)
3. **Custom cloud-init snippets**: Deferred due to complexity and limited API support

## Open Questions
- Should the command require the node name, or should it auto-detect from the VMID?
  - **Decision**: Auto-detect node by querying cluster resources (consistent with existing patterns)

- Should SSH key be read from file path or accept key content directly?
  - **Decision**: Default to file path (`./keys/admin_id_ecdsa.pub`), but validate and accept key content if provided

## Success Criteria
- Command successfully configures cloud-init on an existing VM
- All parameters are validated before API call
- Clear error messages for validation failures
- Tests cover all layers (command, service, repository)
- Documentation includes examples for common use cases
