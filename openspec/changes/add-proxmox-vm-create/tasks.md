# Implementation Tasks

## Task Ordering

Tasks are ordered to deliver user-visible progress incrementally while maintaining test-passing state at each step.

---

## 1. Extend Repository Interface
**Status**: Not Started

Add method signatures to `IProxmoxRepository` interface for VM creation operations.

**Files**:
- `src/repositories/interfaces/proxmox.repository.interface.ts`

**Definition of Done**:
- [ ] `getNextAvailableVmid()` method signature added
- [ ] `cloneFromTemplate()` method signature added
- [ ] `waitForTask()` method signature added
- [ ] TypeScript compiles without errors
- [ ] JSDoc comments added for all new methods

**Dependencies**: None

---

## 2. Implement Repository VMID Allocation
**Status**: Not Started

Implement `getNextAvailableVmid()` in `ProxmoxApiRepository` to find next available VMID.

**Files**:
- `src/repositories/proxmox-api.repository.ts`

**Implementation Steps**:
1. Call `proxmox.cluster.resources.$get({type: 'vm'})` to get all VMs and templates
2. Extract all VMIDs from response array
3. Find first gap >= 100, or max+1
4. Return Result with VMID or RepositoryError

**Definition of Done**:
- [ ] Method implemented with Result return type
- [ ] Handles empty cluster (returns 100)
- [ ] Finds gaps in VMID sequence
- [ ] Handles API errors with RepositoryError
- [ ] TypeScript compiles
- [ ] Unit test added in `test/repositories/proxmox-api.repository.test.ts`
- [ ] Unit test covers: empty cluster, gaps, no gaps, API error
- [ ] All tests pass

**Dependencies**: Task 1

---

## 3. Implement Repository Clone Operation
**Status**: Not Started

Implement `cloneFromTemplate()` in `ProxmoxApiRepository` to clone VMs from templates.

**Files**:
- `src/repositories/proxmox-api.repository.ts`

**Implementation Steps**:
1. Construct proxmox-api call: `proxmox.nodes.$(node).qemu.$(templateVmid).clone.$post({newid, name, full: 1})`
2. Extract task UPID from response
3. Return Result with UPID string or RepositoryError

**Definition of Done**:
- [ ] Method implemented with Result return type
- [ ] Uses `full: 1` parameter for full clone
- [ ] Returns task UPID on success
- [ ] Handles API errors with RepositoryError
- [ ] TypeScript compiles
- [ ] Unit test added covering success and error cases
- [ ] All tests pass

**Dependencies**: Task 1

---

## 4. Implement Repository Task Polling
**Status**: Not Started

Implement `waitForTask()` in `ProxmoxApiRepository` to poll task completion with timeout.

**Files**:
- `src/repositories/proxmox-api.repository.ts`

**Implementation Steps**:
1. Set default timeout to 300000ms (5 minutes)
2. Poll `proxmox.nodes.$(node).tasks.$(upid).status.$get()` every 2 seconds
3. Check if `status !== 'running'`
4. Verify `exitstatus === 'OK'` for success
5. Return Result with void on success, RepositoryError on failure/timeout

**Definition of Done**:
- [ ] Method implemented with polling loop
- [ ] Default timeout is 300000ms
- [ ] Polls every 2 seconds
- [ ] Detects successful completion (exitstatus OK)
- [ ] Detects task failure (exitstatus not OK)
- [ ] Times out after specified duration
- [ ] Returns appropriate RepositoryError for failures
- [ ] TypeScript compiles
- [ ] Unit test added covering: success, failure, timeout, default timeout
- [ ] All tests pass

**Dependencies**: Task 1

**Parallelizable**: Can be implemented in parallel with Task 3

---

## 5. Add Service Template Resolution
**Status**: Not Started

Add private helper method to `ProxmoxVMService` to resolve template name to DTO.

**Files**:
- `src/services/proxmox-vm.service.ts`

**Implementation Steps**:
1. Add private method `resolveTemplate(templateName: string)`
2. Call `repository.listTemplates()`
3. Find template with matching name (case-sensitive)
4. Return Result with ProxmoxTemplateDTO or ServiceError

**Definition of Done**:
- [ ] Private method added to service
- [ ] Uses existing `listTemplates()` repository method
- [ ] Case-sensitive name matching
- [ ] Returns first match if multiple templates have same name
- [ ] Returns ServiceError if template not found
- [ ] TypeScript compiles
- [ ] Unit test added in `test/services/proxmox-vm.service.test.ts`
- [ ] Test covers: exact match, not found, multiple matches
- [ ] All tests pass

**Dependencies**: Task 2, 3, 4 (for repository methods to exist)

---

## 6. Implement Service VM Creation Orchestration
**Status**: Not Started

Implement `createVmFromTemplate()` in `ProxmoxVMService` to orchestrate VM creation.

**Files**:
- `src/services/proxmox-vm.service.ts`

**Implementation Steps**:
1. Call `resolveTemplate(templateName)` from Task 5
2. Call `repository.getNextAvailableVmid()`
3. Call `repository.cloneFromTemplate(template.node, template.vmid, newVmid, vmName)`
4. Call `repository.waitForTask(template.node, upid)`
5. Return Result with {vmid, name, node} or ServiceError

**Definition of Done**:
- [ ] Public method `createVmFromTemplate(vmName, templateName)` added
- [ ] Orchestrates all steps in correct order
- [ ] Handles errors at each step with ServiceError
- [ ] Returns {vmid, name, node} on success
- [ ] TypeScript compiles
- [ ] Unit test added covering: happy path, template not found, VMID allocation failure, clone failure, task wait failure
- [ ] All tests pass

**Dependencies**: Task 5

---

## 7. Create Command Implementation
**Status**: Not Started

Implement `homelab proxmox vm create` command.

**Files**:
- `src/commands/proxmox/vm/create.ts` (new file)

**Implementation Steps**:
1. Create command class extending BaseCommand
2. Define args: vm-name (required), template-name (required)
3. Add static description and examples
4. In `run()`: get service via factory, call `createVmFromTemplate()`, display results

**Definition of Done**:
- [ ] Command file created at correct path
- [ ] Class extends `BaseCommand<typeof ProxmoxVmCreate>`
- [ ] Arguments defined with proper types and descriptions
- [ ] Static description and examples added
- [ ] Uses `ProxmoxVMFactory.createProxmoxVMService()`
- [ ] Displays "Creating VM..." message before operation
- [ ] Displays success message with VMID, name, node
- [ ] Handles errors with clear messages and exit code 1
- [ ] TypeScript compiles
- [ ] Build succeeds: `pnpm run build`
- [ ] Command appears in help: `./bin/dev.js --help`

**Dependencies**: Task 6

---

## 8. Add Command Tests
**Status**: Not Started

Add comprehensive tests for the create command.

**Files**:
- `test/commands/proxmox/vm/create.test.ts` (new file)

**Implementation Steps**:
1. Use `runCommand()` from `@oclif/test`
2. Mock service via factory if possible, or test with real factory + mock repository
3. Test success output, template not found, missing arguments, error handling

**Definition of Done**:
- [ ] Test file created
- [ ] Test: successful VM creation displays correct output
- [ ] Test: template not found shows error message
- [ ] Test: missing vm-name shows usage error
- [ ] Test: missing template-name shows usage error
- [ ] Test: service error displays error message
- [ ] All tests pass: `pnpm test`

**Dependencies**: Task 7

---

## 9. Update Factory (if needed)
**Status**: Not Started

Verify and update `ProxmoxVMFactory` if any changes needed for new service methods.

**Files**:
- `src/factories/proxmox-vm.factory.ts`

**Implementation Steps**:
1. Review factory to ensure it returns service with all required repository methods
2. Update if needed (likely no changes required as factory already wires repository)

**Definition of Done**:
- [ ] Factory verified to support new methods
- [ ] TypeScript compiles
- [ ] All tests pass

**Dependencies**: Task 6

**Parallelizable**: Can be done in parallel with Task 7

---

## 10. Integration Testing
**Status**: Not Started

Manual integration testing with real Proxmox instance (if available) or documented test plan.

**Test Plan**:
1. List templates: `homelab proxmox template list`
2. Create VM: `homelab proxmox vm create test-vm <template-name>`
3. Verify VM appears: `homelab proxmox vm list`
4. Test error: `homelab proxmox vm create test-vm nonexistent-template`
5. Test with missing args: `homelab proxmox vm create`

**Definition of Done**:
- [ ] All manual test cases executed and passed (or documented as blocked)
- [ ] Success output matches spec
- [ ] Error messages are clear and actionable
- [ ] Command appears in help output
- [ ] Command autocomplete works (if applicable)

**Dependencies**: Task 8

---

## 11. Update Documentation
**Status**: Not Started

Update README and add command to oclif manifest.

**Files**:
- `README.md` (auto-generated)

**Implementation Steps**:
1. Run `pnpm run prepack` to regenerate README with new command
2. Verify command appears in README
3. Verify examples are included

**Definition of Done**:
- [ ] `pnpm run prepack` runs successfully
- [ ] README includes `proxmox vm create` command
- [ ] Examples are clear and accurate
- [ ] Build and tests still pass

**Dependencies**: Task 10

---

## Summary

**Total Tasks**: 11

**Critical Path**: 1 → 2 → 5 → 6 → 7 → 8 → 10 → 11

**Parallelizable Work**:
- Tasks 3 and 4 can be done in parallel after Task 1
- Task 9 can be done in parallel with Task 7

**Estimated Effort**:
- Repository layer (Tasks 1-4): ~4 hours
- Service layer (Tasks 5-6): ~2 hours
- Command layer (Tasks 7-8): ~2 hours
- Integration & docs (Tasks 9-11): ~1 hour
- **Total**: ~9 hours

**User-Visible Milestones**:
1. After Task 7: Command available for use (may have bugs)
2. After Task 8: Fully tested command
3. After Task 11: Documented and production-ready
