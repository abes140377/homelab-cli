# Proposal: Add Proxmox VM Delete Command

## Problem Statement

Users currently cannot delete Proxmox VMs through the homelab-cli. They must use the Proxmox web UI or API directly, which is inconvenient for automation workflows and breaks the CLI's goal of providing comprehensive VM lifecycle management.

## Proposed Solution

Add a new `homelab proxmox vm delete` command that allows users to delete VMs by VMID with the following features:

1. **Direct deletion by VMID**: Users can specify one or more VMIDs as arguments
2. **Interactive selection**: If no VMID is provided, list all VMs and allow interactive selection
3. **Confirmation prompts**: Require confirmation before deletion to prevent accidents
4. **Force flag**: Support `--force` flag to skip confirmation (useful for automation)
5. **Graceful error handling**: Handle cases like non-existent VMIDs with clear messages
6. **JSON output**: Support `--json` flag for structured output

## Capabilities Required

### 1. **vm-deletion-capability**
Add repository, service, and command layer support for deleting VMs via Proxmox API.

### 2. **confirmation-prompts** (NEW)
Add a reusable confirmation prompt utility to the interactive prompts library for yes/no confirmations.

## Benefits

- **Consistency**: Completes VM lifecycle management (list, create, configure, delete)
- **Safety**: Confirmation prompts prevent accidental deletions
- **Automation**: Force flag enables scripting scenarios
- **User Experience**: Interactive mode reduces cognitive load (no need to remember VMIDs)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Accidental VM deletion | Require explicit confirmation; provide clear warnings |
| Automation breaking on confirmation | Support `--force` flag to skip prompts |
| Deleting VMs with important data | Display VM details before confirmation |
| Race conditions (VM deleted externally) | Handle API errors gracefully with clear messages |

## Dependencies

- Existing Proxmox API integration (`ProxmoxApiRepository`)
- Existing interactive prompts library (`src/utils/prompts.ts`)
- Existing VM listing functionality (for interactive mode)

## Out of Scope

- Backup creation before deletion (users should handle separately)
- Soft delete / recycle bin functionality
- Bulk operations via file input
- Cascade deletion of related resources (users, firewall rules - Proxmox API handles this)

## Success Criteria

- [ ] Users can delete VMs by VMID: `homelab proxmox vm delete 100`
- [ ] Users can delete multiple VMs: `homelab proxmox vm delete 100 101 102`
- [ ] Users can interactively select VMs to delete when no VMID provided
- [ ] Confirmation prompt displays VM details and requires explicit confirmation
- [ ] `--force` flag skips confirmation for automation
- [ ] `--json` flag returns structured deletion results
- [ ] Clear error messages for non-existent VMIDs
- [ ] All tests pass with comprehensive coverage
