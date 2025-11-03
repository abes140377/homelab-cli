# Proposal: Add Proxmox VM Create Command

## Overview

Implement a new `proxmox vm create` command that enables users to create new Proxmox QEMU virtual machines from existing templates via the CLI. This capability extends the existing Proxmox VM management functionality by adding creation/cloning capabilities alongside the existing listing operations.

## Why

Users currently need to switch context between the CLI and Proxmox web UI to create VMs from templates. This breaks the CLI workflow and adds friction to common homelab operations. By adding VM creation to the CLI, users can complete the entire VM provisioning workflow (list templates → create VM → verify VM) without leaving the terminal. This aligns with the CLI's goal of providing comprehensive homelab infrastructure management and improves user productivity.

## What Changes

This proposal adds:

1. **Repository Layer**: Three new methods on `IProxmoxRepository` and implementation in `ProxmoxApiRepository`:
   - `getNextAvailableVmid()` - Finds next available VMID in cluster
   - `cloneFromTemplate()` - Clones a template VM using Proxmox API
   - `waitForTask()` - Polls Proxmox task status until completion

2. **Service Layer**: One new method on `ProxmoxVMService`:
   - `createVmFromTemplate(vmName, templateName)` - Orchestrates VM creation from template name

3. **Command Layer**: New command at `src/commands/proxmox/vm/create.ts`:
   - Command: `homelab proxmox vm create <vm-name> <template-name>`
   - Accepts VM name and template name as arguments
   - Displays creation progress and result

4. **Tests**: Comprehensive test coverage across all layers:
   - Repository tests for VMID allocation, cloning, and task polling
   - Service tests for orchestration and error handling
   - Command tests for user interaction and output

All changes follow the existing layered architecture pattern and use the `Result<T, E>` type for error handling.

## Motivation

Currently, the homelab-cli supports:
- Listing Proxmox VMs (`proxmox vm list`)
- Listing Proxmox templates (`proxmox template list`)
- Listing LXC containers (`proxmox container list`)

However, users must manually use the Proxmox web UI or API to create new VMs from templates. This proposal adds VM creation capability to complete the basic VM lifecycle management within the CLI.

## Scope

### In Scope
- Implement `homelab proxmox vm create <vm-name> <template-name>` command
- Add clone/create functionality to the Proxmox repository layer using the proxmox-api npm package
- Add VM creation methods to the Proxmox service layer
- Implement template lookup by name (resolve template name to vmid)
- Automatic VMID allocation (find next available VMID)
- Support for full clones from templates
- Basic error handling for common failure scenarios (template not found, VMID conflicts, API errors)
- Integration tests for the new command

### Out of Scope
- Linked clones (only full clones will be supported initially)
- Custom VM configuration during creation (CPU, memory, disk size, etc.) - will use template defaults
- VM starting after creation (user can start via web UI or future command)
- Interactive prompts for configuration
- Support for multiple templates or batch creation
- LXC container creation (this proposal focuses on QEMU VMs only)
- VM deletion, modification, or other lifecycle operations

## User Impact

### Before
Users need to:
1. Use `homelab proxmox template list` to find template VMID
2. Switch to Proxmox web UI or use curl/API directly to clone the template
3. Manually specify VMID, name, and other parameters

### After
Users can:
1. Run `homelab proxmox vm create my-new-vm ubuntu-22.04`
2. The CLI automatically resolves the template name, allocates a VMID, and creates the VM
3. Receive immediate feedback on success/failure

### Example Usage
```bash
# List available templates
$ homelab proxmox template list
┌──────┬─────────────────┬──────────┐
│ VMID │ Name            │ Template │
├──────┼─────────────────┼──────────┤
│ 100  │ ubuntu-22.04    │ Yes      │
│ 101  │ debian-12       │ Yes      │
└──────┴─────────────────┴──────────┘

# Create a new VM from the ubuntu-22.04 template
$ homelab proxmox vm create my-ubuntu-server ubuntu-22.04
Creating VM 'my-ubuntu-server' from template 'ubuntu-22.04'...
Successfully created VM 200 on node 'pve'

# Verify the VM was created
$ homelab proxmox vm list
┌──────┬───────────────────┬─────────┬──────────────┐
│ VMID │ Name              │ Status  │ IPv4 Address │
├──────┼───────────────────┼─────────┼──────────────┤
│ 200  │ my-ubuntu-server  │ stopped │ N/A          │
└──────┴───────────────────┴─────────┴──────────────┘
```

## Dependencies

- Existing `proxmox-api` npm package (already in package.json)
- Existing Proxmox repository, service, and factory infrastructure
- Existing template listing capability for name-to-VMID resolution

## Risks and Mitigations

### Risk: Template name resolution conflicts
- **Risk**: Multiple templates with the same name across different nodes
- **Mitigation**: Use the first match and document this behavior; future enhancement could add node specification

### Risk: VMID allocation conflicts
- **Risk**: Race condition when finding next available VMID
- **Mitigation**: Use Proxmox API's built-in VMID allocation if available; otherwise implement simple next-available logic with error handling for conflicts

### Risk: Long-running clone operations
- **Risk**: Cloning large templates may take time; CLI appears to hang
- **Mitigation**: Implement task polling with timeout and user feedback; show "Creating..." message immediately

## Alternatives Considered

### Alternative 1: Interactive wizard with prompts
- **Rejected**: Adds complexity and reduces scriptability; can be added later if needed

### Alternative 2: Support all VM configuration options as flags
- **Rejected**: Too many flags for initial implementation; users can modify VMs after creation

### Alternative 3: Use linked clones instead of full clones
- **Rejected**: Full clones are simpler and safer for initial implementation; linked clones can be added later

## Success Criteria

1. Users can create VMs from templates using simple CLI commands
2. Template names are automatically resolved to VMIDs
3. VMIDs are automatically allocated without conflicts
4. Command provides clear feedback on success/failure
5. All tests pass including integration tests with mock Proxmox API
6. Documentation is updated with examples
