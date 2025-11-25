# Proposal: Add Proxmox VM Start Command

## Meta
- **ID**: add-proxmox-vm-start-command
- **Status**: proposed
- **Created**: 2025-11-25
- **Scope**: command-layer, service-layer, repository-layer

## Why
Users currently cannot start stopped Proxmox virtual machines (VMs) through the homelab-cli. This requires users to access the Proxmox web UI or use other tools to start VMs, breaking the workflow of managing infrastructure through the CLI.

The homelab-cli already supports VM creation, configuration (cloud-init), and deletion, but lacks the ability to start stopped VMs. This gap forces users to switch contexts between the CLI and web UI for basic lifecycle management. Adding start capability completes the VM lifecycle management workflow within the CLI, improving operational efficiency and user experience.

## Problem Statement
Users currently cannot start stopped Proxmox virtual machines (VMs) through the homelab-cli. This requires users to access the Proxmox web UI or use other tools to start VMs, breaking the workflow of managing infrastructure through the CLI.

## Proposed Solution
Add a new oclif command `homelab proxmox vm start` that allows users to:
1. Start one or more VMs by specifying their VM IDs as command arguments
2. Interactively select VMs to start from a list of stopped VMs when no VM IDs are provided
3. Receive clear feedback about the start operation's success or failure

The implementation will follow the established layered architecture pattern (command → service → repository) and reuse existing infrastructure like the ProxmoxVMDTO model and interactive prompt utilities.

## Goals
- Provide CLI capability to start stopped Proxmox VMs
- Support both direct VM ID specification and interactive selection
- Handle multiple VMs in a single invocation
- Provide clear, actionable error messages
- Follow existing architectural patterns and conventions

## Non-Goals
- Starting VMs that are already running (should be a no-op or clear message)
- Controlling VM start order or dependencies
- Advanced start options (like forcing start, selecting boot device, etc.)
- Starting LXC containers (separate feature, different resource type)

## User Impact
- **Positive**: Users can manage VM lifecycle operations (create, configure, start, stop, delete) entirely through the CLI
- **Breaking Changes**: None - this is a new feature addition

## Dependencies
- Existing Proxmox API integration via `proxmox-api` package
- Existing ProxmoxVMDTO model and ProxmoxVMService
- Interactive prompt utilities (`promptForMultipleSelections`)
- Layered architecture (command, service, repository layers)

## Alternatives Considered
1. **Combined start/stop command**: Could have created a single `homelab proxmox vm control` command with subcommands or flags. Rejected because separate commands are more intuitive and follow Unix philosophy.
2. **Auto-start after VM creation**: Could automatically start VMs after creation. Rejected because users may want to configure VMs before first boot.
3. **Batch start by status filter**: Could add flags like `--all-stopped` to start all stopped VMs. Deferred as future enhancement to keep initial implementation simple.

## What Changes

### Repository Layer
- Add `startVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>` method to IProxmoxRepository interface
- Implement startVM in ProxmoxApiRepository that POSTs to `/nodes/{node}/qemu/{vmid}/status/start`
- Return task UPID on success or RepositoryError on failure

### Service Layer
- Add `startVM(vmid: number): Promise<Result<{vmid, name, node}, ServiceError>>` to ProxmoxVMService
- Service finds VM's node by listing VMs, then calls repository startVM
- Wrap repository errors in ServiceError with user-friendly messages

### Command Layer
- New command file: `src/commands/proxmox/vm/start.ts`
- Class: `ProxmoxVmStart extends BaseCommand`
- Supports variadic VM IDs as arguments: `homelab proxmox vm start 100 101 102`
- Interactive mode when no args: filters stopped VMs and prompts for selection
- JSON output mode via `--json` flag
- Progress display for multiple VMs and summary output

### Testing
- Repository tests in `test/repositories/proxmox-api.repository.test.ts`
- Service tests in `test/services/proxmox-vm.service.test.ts`
- Command tests in `test/commands/proxmox/vm/start.test.ts`

## Implementation Overview
The implementation will add:
1. **Repository Layer**: New method `startVM(node: string, vmid: number)` to call Proxmox API endpoint `POST /nodes/{node}/qemu/{vmid}/status/start`
2. **Service Layer**: New method `startVM(vmid: number)` to orchestrate repository call with proper error handling
3. **Command Layer**: New command at `src/commands/proxmox/vm/start.ts` that handles CLI interaction, VM selection, and output formatting

## Success Criteria
- [ ] Users can start a single VM: `homelab proxmox vm start 100`
- [ ] Users can start multiple VMs: `homelab proxmox vm start 100 101 102`
- [ ] Users can interactively select VMs: `homelab proxmox vm start` (no args)
- [ ] Interactive mode only shows stopped VMs
- [ ] Clear error messages for invalid VM IDs
- [ ] All tests pass (repository, service, command layers)
- [ ] Documentation updated (README auto-generated via oclif)

## Related Specs
- **proxmox-vm-management**: This change extends VM management capabilities with start operation
- **interactive-prompts**: Reuses existing prompt utilities for VM selection

## Related Changes
- Future: Add `homelab proxmox vm stop` command (complementary operation)
- Future: Add `homelab proxmox vm restart` command
- Future: Add VM status summary command showing running/stopped counts
