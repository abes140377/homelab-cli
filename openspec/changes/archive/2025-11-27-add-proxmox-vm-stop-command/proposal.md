# Proposal: Add Proxmox VM Stop Command

## Status
- **State**: Draft
- **Created**: 2025-11-25
- **Author**: Claude Code (OpenSpec Agent)

## Overview
Add a new oclif command to the homelab-cli that allows users to stop running Proxmox virtual machines (VMs) by specifying their VM IDs. If no VM ID is provided, the command should list all running VMs and allow the user to select one or more VMs to stop interactively using the `promptForMultipleSelections` utility function.

## Motivation
Currently, users can start VMs using the `homelab proxmox vm start` command, but there is no corresponding command to stop running VMs. This creates an asymmetric user experience where VMs can be started via the CLI but must be stopped through the Proxmox web interface or API directly. Adding a VM stop command completes this lifecycle management capability and follows the same patterns established by the start, delete, and create commands.

## Goals
1. Provide a CLI command to stop one or more running VMs by VMID
2. Support interactive mode for selecting VMs when no VMIDs are provided
3. Filter interactive selection to show only running VMs
4. Follow existing patterns from `vm start` and `vm delete` commands
5. Provide clear error messages and user feedback
6. Support JSON output mode for scripting
7. Handle partial failures gracefully when stopping multiple VMs

## Non-Goals
- Forcing VM shutdown (use graceful shutdown only)
- Restarting or suspending VMs (separate commands)
- Scheduling VM stops
- Stopping LXC containers (separate command space)

## Design References
- See `design.md` for architectural details
- Follows layered architecture: Repository → Service → Command
- Reuses existing Proxmox API integration patterns
- Mirrors `vm start` command structure for consistency

## Scope
This change adds:
1. Repository method: `stopVM(node: string, vmid: number)`
2. Service method: `stopVM(vmid: number)`
3. Command: `homelab proxmox vm stop [vmids...]`
4. Interactive selection filtering for running VMs
5. Comprehensive tests for all layers

## Dependencies
- Depends on existing `proxmox-vm-management` spec (repository interface, DTOs)
- Depends on `interactive-prompts` spec (promptForMultipleSelections)
- Depends on `vm-start-capability` spec (similar patterns)

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Proxmox API shutdown behavior differs from start | Medium | Test against real Proxmox cluster; follow API documentation |
| User accidentally stops critical VMs | High | Interactive mode shows VM details; require explicit VMID arguments; no force flag by default |
| API timeout during graceful shutdown | Medium | Use existing waitForTask pattern; provide clear timeout messaging |

## Success Criteria
- [ ] Command `homelab proxmox vm stop 100` successfully stops a running VM
- [ ] Interactive mode lists only running VMs for selection
- [ ] Multiple VMs can be stopped with progress feedback
- [ ] JSON output mode works for single and multiple VMs
- [ ] All tests pass with >90% coverage
- [ ] Error messages are clear and actionable
- [ ] Documentation includes examples and help text

## Open Questions
None - design follows established patterns from VM start command.
