# Proposal: Add Proxmox Container List Command

## Why

Users managing Proxmox infrastructure need visibility into their LXC containers through the CLI. Currently, the `homelab proxmox vm list` command only displays QEMU virtual machines. While the underlying infrastructure (repository and service layers) already supports listing LXC containers via the `listResources('lxc')` method, there is no CLI command to expose this functionality to users. This forces users to access the Proxmox web interface or use the API directly to view their LXC containers, reducing the CLI's utility for comprehensive infrastructure management.

LXC containers are lightweight virtualization alternatives commonly used in Proxmox environments alongside QEMU VMs. Providing a dedicated `homelab proxmox container list` command will give users a consistent interface pattern for managing both VM types and complete the infrastructure management toolkit.

## What Changes

- Add new command `homelab proxmox container list` at `src/commands/proxmox/container/list.ts`
- Command will invoke `ProxmoxVMService.listVMs('lxc')` to retrieve LXC containers
- Display output in tabular format using `cli-table3` with columns: VMID, Name, Status, IPv4 Address
- Reuse existing `ProxmoxVMFactory` to create service instances (no new factory needed)
- Add comprehensive command tests at `test/commands/proxmox/container/list.test.ts`
- Follow the same architectural pattern as the `proxmox vm list` command for consistency

## Impact

- **Affected specs**: Extends `proxmox-vm-management` capability with new LXC container listing requirement
- **Affected code**:
  - New: `src/commands/proxmox/container/list.ts` (new command implementation)
  - New: `test/commands/proxmox/container/list.test.ts` (command tests)
  - Modified: `openspec/specs/proxmox-vm-management/spec.md` (add container list command requirement)
- **Dependencies**: No new npm packages required (reuses existing infrastructure)
- **User impact**:
  - Users can now list LXC containers via `homelab proxmox container list`
  - Consistent command structure with `homelab proxmox vm list`
  - Same tabular output format for easy comparison
  - Provides complete Proxmox resource visibility through the CLI
- **Breaking changes**: None (new command only, no changes to existing functionality)
