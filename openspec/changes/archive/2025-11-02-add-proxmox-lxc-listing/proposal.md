# Proposal: Add Proxmox LXC Container Listing

## Why

Users managing Proxmox infrastructure need to list both QEMU VMs and LXC containers. Currently, the `homelab proxmox vm list` command only shows QEMU virtual machines (filtered by type 'qemu'). LXC containers, which are lightweight virtualization alternatives commonly used in Proxmox environments, are not visible through the CLI. This gap forces users to access the Proxmox web interface or API directly to view their LXC containers, reducing the CLI's utility for comprehensive infrastructure management.

## What Changes

- Refactor the `ProxmoxApiRepository.listVMs()` method to `listResources(resourceType: 'qemu' | 'lxc')` to support both VM types
- Update the repository interface `IProxmoxRepository` to reflect the new method signature
- Modify the `ProxmoxVMService` to accept a resource type parameter and pass it to the repository
- Update the existing `homelab proxmox vm list` command to specify resource type 'qemu' (maintaining current behavior)
- Extend LXC resource listing to include the same columns as QEMU VMs: vmid, name, status, and IPv4 address
- Add comprehensive tests for the refactored repository method covering both 'qemu' and 'lxc' resource types
- Update existing service and command tests to verify the new parameter handling

## Impact

- **Affected specs**: Creates new capability `proxmox-vm-management` (LXC containers are a type of VM resource in Proxmox)
- **Affected code**:
  - Modified: `src/repositories/proxmox-api.repository.ts` (rename `listVMs` → `listResources`, add `resourceType` parameter)
  - Modified: `src/repositories/interfaces/proxmox.repository.interface.ts` (update method signature)
  - Modified: `src/services/proxmox-vm.service.ts` (add resource type parameter)
  - Modified: `src/commands/proxmox/vm/list.ts` (pass 'qemu' type explicitly)
  - Modified: `test/services/proxmox-vm.service.test.ts` (update tests for new parameter)
- **Dependencies**: No new npm packages required (reuses existing proxmox-api client)
- **User impact**:
  - Existing command behavior unchanged (maintains backward compatibility)
  - Enables future capability to list LXC containers with same command pattern
  - Provides consistent interface for managing both VM types
- **Breaking changes**: None (internal refactoring only; existing command maintains same behavior)
