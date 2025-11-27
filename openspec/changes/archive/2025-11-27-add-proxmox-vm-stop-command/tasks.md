# Tasks: Add Proxmox VM Stop Command

## Overview
Implementation tasks for adding the `homelab proxmox vm stop` command. Tasks are ordered to deliver incremental, testable progress following the layered architecture pattern.

## Task List

### 1. Add stopVM method to repository interface
- **File**: `src/repositories/interfaces/proxmox.repository.interface.ts`
- **Actions**:
  - Add `stopVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>` method signature
  - Add JSDoc comment describing the method's purpose and parameters
  - Ensure signature matches startVM pattern for consistency
- **Validation**: TypeScript compilation succeeds
- **Dependencies**: None

### 2. Implement stopVM in ProxmoxApiRepository
- **File**: `src/repositories/proxmox-api.repository.ts`
- **Actions**:
  - Implement `stopVM` method that POSTs to `/nodes/{node}/qemu/{vmid}/status/stop`
  - Return Result containing task UPID on success
  - Wrap API errors in RepositoryError with descriptive messages
  - Add debug logging for errors (using existing debug logger pattern)
- **Validation**: TypeScript compilation succeeds, manual API test if possible
- **Dependencies**: Task 1

### 3. Add repository tests for stopVM
- **File**: `test/repositories/proxmox-api.repository.test.ts`
- **Actions**:
  - Add test case for successful VM stop (mock API client)
  - Add test case for VM not found error
  - Add test case for API error handling
  - Add test case for network error handling
  - Verify correct endpoint construction
  - Verify task UPID is returned in success Result
- **Validation**: `pnpm test` passes for repository tests
- **Dependencies**: Task 2

### 4. Add stopVM method to ProxmoxVMService
- **File**: `src/services/proxmox-vm.service.ts`
- **Actions**:
  - Implement `stopVM(vmid: number): Promise<Result<{vmid: number, name: string, node: string}, ServiceError>>` method
  - List all VMs to find the VM's node
  - Handle VM not found case with helpful error message
  - Call repository's `stopVM(node, vmid)` method
  - Wrap repository errors in ServiceError
  - Return VM details (vmid, name, node) on success
- **Validation**: TypeScript compilation succeeds
- **Dependencies**: Task 2

### 5. Add service tests for stopVM
- **File**: `test/services/proxmox-vm.service.test.ts`
- **Actions**:
  - Add test case for successful VM stop (mock repository)
  - Add test case for VM not found in listing
  - Add test case for repository error handling
  - Verify service finds VM node correctly
  - Verify error wrapping from RepositoryError to ServiceError
  - Verify Result pattern used correctly
- **Validation**: `pnpm test` passes for service tests
- **Dependencies**: Task 4

### 6. Create stop command implementation
- **File**: `src/commands/proxmox/vm/stop.ts`
- **Actions**:
  - Create ProxmoxVmStop class extending BaseCommand
  - Define variadic vmids argument with `static strict = false`
  - Implement argument parsing (convert argv to integers, filter out NaN)
  - Implement interactive mode using `promptForMultipleSelections`
  - Filter for running VMs only in interactive mode: `status === 'running'`
  - Show "No running VMs available to stop" if no running VMs
  - Implement sequential VM stop with progress display
  - Implement summary display for multiple VMs
  - Handle partial failures (continue on error, collect results)
  - Implement JSON output mode
  - Validate VMIDs exist before attempting stop
  - Add static description: "Stop one or more running Proxmox VMs"
  - Add static examples showing single VM, multiple VMs, interactive mode, JSON mode
- **Validation**: `pnpm run build` succeeds, manual command testing
- **Dependencies**: Task 4

### 7. Add command tests for stop
- **File**: `test/commands/proxmox/vm/stop.test.ts`
- **Actions**:
  - Add test for single VM stop with success output
  - Add test for multiple VM stop with progress and summary
  - Add test for VM not found error handling
  - Add test for invalid VM ID handling (all provided VMIDs not found)
  - Add test for partial failure scenario
  - Add test for JSON output mode (single VM)
  - Add test for JSON output mode (multiple VMs)
  - Add test for JSON output with failures
  - Add test for non-numeric argument filtering
  - Use `@oclif/test` `runCommand` helper
  - Mock service responses appropriately
- **Validation**: `pnpm test` passes for command tests
- **Dependencies**: Task 6
- **Note**: Interactive mode and "no running VMs" scenario may be challenging to test with oclif test harness; focus on core functionality

### 8. Run full test suite
- **File**: N/A
- **Actions**:
  - Execute `pnpm test` to run all tests
  - Verify all existing tests still pass (no regressions)
  - Verify new tests pass
  - Check test coverage meets project standards (>90%)
- **Validation**: All tests pass, coverage adequate
- **Dependencies**: Tasks 3, 5, 7

### 9. Run linting
- **File**: N/A
- **Actions**:
  - Execute `pnpm run lint`
  - Fix any linting errors or warnings
  - Ensure code follows project style guide
- **Validation**: Linting passes with no errors
- **Dependencies**: Task 8

### 10. Build and verify command
- **File**: N/A
- **Actions**:
  - Execute `pnpm run build`
  - Test command manually: `./bin/dev.js proxmox vm stop --help`
  - Verify help text displays correctly
  - Test single VM stop (if test environment available)
  - Test interactive mode (if test environment available)
  - Test JSON output mode
- **Validation**: Build succeeds, command executes correctly, help text accurate
- **Dependencies**: Task 9

### 11. Update README
- **File**: `README.md`
- **Actions**:
  - Run `pnpm run prepack` (generates manifest and updates README automatically)
  - Verify new command appears in command list
  - Verify examples are included
- **Validation**: README includes new command documentation
- **Dependencies**: Task 10

## Success Criteria Checklist

- [x] Repository interface includes `stopVM` method
- [x] Repository implementation calls correct Proxmox API endpoint
- [x] Service layer resolves VM node and handles errors properly
- [x] Command accepts variadic VMID arguments
- [x] Interactive mode filters for running VMs only
- [x] Progress display works for multiple VMs
- [x] Summary shows successful and failed stops
- [x] JSON output mode works correctly
- [x] Error messages are clear and actionable
- [x] All tests pass (`pnpm test`)
- [x] Linting passes (`pnpm run lint`)
- [x] Build succeeds (`pnpm run build`)
- [x] README updated with new command
- [x] Manual testing confirms expected behavior

## Parallelization Opportunities

The following tasks can be worked on in parallel:
- Tasks 3, 5, 7 (test writing) can be started as soon as their corresponding implementation tasks complete
- Tasks 1-2 (repository layer) are independent of tasks 4-5 (service layer) initially
- Documentation can be drafted alongside implementation

## Estimated Effort

- **Repository Layer** (Tasks 1-3): 1-2 hours
- **Service Layer** (Tasks 4-5): 1-2 hours
- **Command Layer** (Tasks 6-7): 2-3 hours
- **Integration & Testing** (Tasks 8-11): 1 hour
- **Total**: 5-8 hours

## Notes

- Follow existing patterns from `vm/start.ts` command for consistency
- Reuse `promptForMultipleSelections` utility from `src/utils/prompts.ts`
- Use existing error handling patterns (Result type, error wrapping)
- Maintain consistency with JSON output format from start command
- Sequential execution is intentional (not a performance issue)
- Consider adding integration tests against real Proxmox if available
