# Implementation Tasks

## 1. Repository Layer Refactoring

- [ ] 1.1 Rename `listVMs()` method to `listResources(resourceType: 'qemu' | 'lxc')` in `src/repositories/proxmox-api.repository.ts`
- [ ] 1.2 Add `resourceType` parameter to method signature
- [ ] 1.3 Update resource filtering logic to filter by `resource.type === resourceType`
- [ ] 1.4 For QEMU type, maintain existing filter: `type === 'qemu' AND template !== 1`
- [ ] 1.5 For LXC type, filter by: `type === 'lxc'` only
- [ ] 1.6 Refactor `fetchVMIPAddress` to accept `resourceType` parameter
- [ ] 1.7 Update guest agent endpoint construction to use dynamic path: `/nodes/${node}/${resourceType}/${vmid}/agent/network-get-interfaces`
- [ ] 1.8 Verify IPv4 extraction logic works for both QEMU and LXC guest agent responses

## 2. Repository Interface Update

- [ ] 2.1 Update `IProxmoxRepository` interface in `src/repositories/interfaces/proxmox.repository.interface.ts`
- [ ] 2.2 Replace `listVMs(): Promise<Result<ProxmoxVMDTO[], RepositoryError>>` with `listResources(resourceType: 'qemu' | 'lxc'): Promise<Result<ProxmoxVMDTO[], RepositoryError>>`
- [ ] 2.3 Ensure TypeScript compilation succeeds with updated interface

## 3. Service Layer Update

- [ ] 3.1 Update `ProxmoxVMService.listVMs()` in `src/services/proxmox-vm.service.ts` to accept `resourceType: 'qemu' | 'lxc'` parameter
- [ ] 3.2 Pass `resourceType` parameter to `repository.listResources(resourceType)`
- [ ] 3.3 Update method signature to `listVMs(resourceType: 'qemu' | 'lxc'): Promise<Result<ProxmoxVMDTO[], ServiceError>>`
- [ ] 3.4 Verify error handling remains consistent

## 4. Command Layer Update

- [ ] 4.1 Update `src/commands/proxmox/vm/list.ts` to pass 'qemu' as resource type: `service.listVMs('qemu')`
- [ ] 4.2 Verify command output format remains unchanged
- [ ] 4.3 Verify command continues to display only QEMU VMs (backward compatibility)

## 5. Factory Update

- [ ] 5.1 Review `src/factories/proxmox-vm.factory.ts` and ensure it still works with updated service signature
- [ ] 5.2 No changes needed if factory only creates service instance without calling methods

## 6. Testing - Repository Layer

- [ ] 6.1 Update existing repository tests to use new `listResources()` method name
- [ ] 6.2 Add test case: `listResources('qemu')` filters by type 'qemu' and template !== 1
- [ ] 6.3 Add test case: `listResources('lxc')` filters by type 'lxc'
- [ ] 6.4 Add test case: QEMU guest agent endpoint uses `/nodes/{node}/qemu/{vmid}/agent/network-get-interfaces`
- [ ] 6.5 Add test case: LXC guest agent endpoint uses `/nodes/{node}/lxc/{vmid}/agent/network-get-interfaces`
- [ ] 6.6 Add test case: IPv4 extraction works for LXC guest agent response format
- [ ] 6.7 Add test case: LXC guest agent unavailable returns null gracefully
- [ ] 6.8 Verify all repository tests pass with `pnpm exec mocha --forbid-only "test/repositories/proxmox-api.repository.test.ts"` (if test file exists, otherwise create)

## 7. Testing - Service Layer

- [ ] 7.1 Update `test/services/proxmox-vm.service.test.ts` to pass resource type parameter in all test calls
- [ ] 7.2 Add test case: `service.listVMs('qemu')` calls `repository.listResources('qemu')`
- [ ] 7.3 Add test case: `service.listVMs('lxc')` calls `repository.listResources('lxc')`
- [ ] 7.4 Add test case: Service handles repository errors for both resource types
- [ ] 7.5 Verify all service tests pass with `pnpm exec mocha --forbid-only "test/services/proxmox-vm.service.test.ts"`

## 8. Testing - Command Layer

- [ ] 8.1 Update `test/commands/proxmox/vm/list.test.ts` if it contains actual test logic (currently it's a placeholder)
- [ ] 8.2 Verify command integration test (if exists) confirms 'qemu' type is passed
- [ ] 8.3 Verify backward compatibility: command output unchanged for same Proxmox state

## 9. Integration Testing

- [ ] 9.1 If `test/integration/proxmox-api.integration.test.ts` exists, update it to test both resource types
- [ ] 9.2 Manually test against real Proxmox instance (if available) with both QEMU VMs and LXC containers
- [ ] 9.3 Verify IPv4 addresses are correctly retrieved for LXC containers

## 10. Quality Checks

- [ ] 10.1 Run `pnpm run build` to ensure TypeScript compilation succeeds
- [ ] 10.2 Run `pnpm test` to ensure all tests pass
- [ ] 10.3 Run `pnpm run lint` to ensure code style compliance
- [ ] 10.4 Manually test command: `./bin/dev.js proxmox vm list`
- [ ] 10.5 Verify command output shows only QEMU VMs (backward compatibility maintained)

## 11. Documentation

- [ ] 11.1 Run `pnpm run prepack` to update README with any command changes
- [ ] 11.2 Verify auto-generated documentation is correct
- [ ] 11.3 Update CLAUDE.md if any architectural patterns changed (likely not needed for this refactoring)

## 12. Code Review Checklist

- [ ] 12.1 Verify no breaking changes to existing command behavior
- [ ] 12.2 Verify type safety with TypeScript strict mode
- [ ] 12.3 Verify error handling covers both QEMU and LXC cases
- [ ] 12.4 Verify test coverage for new resource type parameter
- [ ] 12.5 Verify backward compatibility: existing `homelab proxmox vm list` output unchanged
