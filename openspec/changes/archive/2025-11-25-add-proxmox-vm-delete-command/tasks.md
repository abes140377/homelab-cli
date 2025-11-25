# Implementation Tasks: Add Proxmox VM Delete Command

## Phase 1: Confirmation Prompt Foundation

### Task 1.1: Add ConfirmationOptions interface
- [x] Open `src/utils/prompts.types.ts`
- [x] Add `ConfirmationOptions` interface extending `Omit<PromptOptions<boolean>, 'validate'>`
- [x] Include JSDoc documentation explaining the interface
- [x] Verify TypeScript compilation succeeds: `pnpm run build`

### Task 1.2: Implement promptForConfirmation utility
- [x] Open `src/utils/prompts.ts`
- [x] Import `ConfirmationOptions` type
- [x] Add `promptForConfirmation` function using Enquirer confirm prompt:
  - [x] Handle `skip` option to return initial value without prompting
  - [x] Use Enquirer.prompt with `type: 'confirm'`
  - [x] Map response to Result<boolean, Error>
  - [x] Handle cancellation errors (Ctrl+C, ESC)
- [x] Export `promptForConfirmation` function from module
- [x] Add JSDoc documentation with usage examples
- [x] Verify TypeScript compilation succeeds: `pnpm run build`

### Task 1.3: Test promptForConfirmation
- [x] Open `test/utils/prompts.test.ts`
- [x] Add test suite for `promptForConfirmation`:
  - [x] Test returning true when user selects Yes
  - [x] Test returning false when user selects No
  - [x] Test default value pre-selection (initial: true)
  - [x] Test default value pre-selection (initial: false)
  - [x] Test skip functionality returns initial value
  - [x] Test error handling for user cancellation
- [x] Run tests: `pnpm test`
- [x] Verify all new tests pass

## Phase 2: Repository Layer - VM Deletion

### Task 2.1: Add deleteVM to repository interface
- [x] Open `src/repositories/interfaces/proxmox.repository.interface.ts`
- [x] Add method signature: `deleteVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>`
- [x] Add JSDoc comment explaining:
  - [x] Method destroys VM and all owned volumes
  - [x] Returns UPID for async task tracking
  - [x] Parameters: node (where VM resides), vmid (VM ID)
- [x] Verify TypeScript compilation succeeds: `pnpm run build`

### Task 2.2: Implement deleteVM in ProxmoxApiRepository
- [x] Open `src/repositories/proxmox-api.repository.ts`
- [x] Implement `deleteVM` method:
  - [x] Call `DELETE /nodes/{node}/qemu/{vmid}` via proxmox-api
  - [x] Use `proxmox.nodes.$(node).qemu.$(vmid).$delete()`
  - [x] Handle successful response (extract UPID)
  - [x] Add try-catch block for error handling
  - [x] Add debug logging using `logDebugError` in catch block
  - [x] Include non-sensitive context (node, vmid) in debug logs
  - [x] Map errors to RepositoryError with user-friendly messages
  - [x] Return `success(upid)` on successful deletion
  - [x] Return `failure(RepositoryError)` on error
- [x] Verify TypeScript compilation succeeds: `pnpm run build`
- [x] Follow existing patterns from `cloneFromTemplate` and `setVMConfig`

### Task 2.3: Test deleteVM repository method
- [x] Open `test/repositories/proxmox-api.repository.test.ts`
- [x] Add test suite for `deleteVM`:
  - [x] Test successful VM deletion returns UPID
  - [x] Test handling of non-existent VM (404 error)
  - [x] Test handling of permission errors (403/401)
  - [x] Test correct API endpoint construction
  - [x] Test debug logging output when enabled
  - [x] Test error message clarity and actionability
- [x] Mock Proxmox API responses for each scenario
- [x] Run repository tests: `pnpm exec mocha --forbid-only "test/repositories/proxmox-api.repository.test.ts"`
- [x] Verify all tests pass

## Phase 3: Service Layer - VM Deletion Logic

### Task 3.1: Add deleteVM to ProxmoxVMService
- [x] Open `src/services/proxmox-vm.service.ts`
- [x] Add `deleteVM(vmid: number)` method:
  - [x] Call `listVMs('qemu')` to get all VMs
  - [x] Find VM with matching vmid in the list
  - [x] Return failure ServiceError if VM not found: "VM {vmid} not found"
  - [x] Extract node from found VM
  - [x] Call `repository.deleteVM(node, vmid)`
  - [x] Handle repository errors (wrap in ServiceError)
  - [x] On success, call `repository.waitForTask(node, upid)` to wait for completion
  - [x] Return Result<{vmid: number, name: string, node: string}, ServiceError>
- [x] Add JSDoc documentation explaining the method
- [x] Verify TypeScript compilation succeeds: `pnpm run build`

### Task 3.2: Test deleteVM service method
- [x] Open `test/services/proxmox-vm.service.test.ts`
- [x] Add test suite for `deleteVM`:
  - [x] Test successful deletion with node lookup
  - [x] Test error when VM not found (not in list)
  - [x] Test error propagation from repository
  - [x] Test task waiting functionality
  - [x] Test ServiceError wrapping of RepositoryErrors
  - [x] Verify correct node passed to repository
- [x] Create mock repository using IProxmoxRepository interface
- [x] Run service tests: `pnpm exec mocha --forbid-only "test/services/proxmox-vm.service.test.ts"`
- [x] Verify all tests pass

## Phase 4: Command Layer - Delete Command

### Task 4.1: Create ProxmoxVmDelete command
- [x] Create file `src/commands/proxmox/vm/delete.ts`
- [x] Define class extending `BaseCommand<typeof ProxmoxVmDelete>`:
  - [x] Add static description: "Delete one or more Proxmox VMs"
  - [x] Add warning in description: "WARNING: This action cannot be undone."
  - [x] Define static args:
    - [x] `vmids`: Args.integer({description: 'VM IDs to delete', required: false})
    - [x] Use rest parameter syntax for variadic arguments
  - [x] Define static flags:
    - [x] `force`: Flags.boolean({char: 'f', description: 'Skip confirmation prompts', default: false})
  - [x] Add static examples:
    - [x] Single VM deletion: `homelab proxmox vm delete 100`
    - [x] Multiple VM deletion: `homelab proxmox vm delete 100 101 102`
    - [x] Force deletion: `homelab proxmox vm delete 100 --force`
    - [x] Interactive mode: `homelab proxmox vm delete`
    - [x] JSON output: `homelab proxmox vm delete 100 --json --force`
- [x] Implement `async run()` method:
  - [x] Parse command arguments and flags
  - [x] Get service from factory: `ProxmoxVMFactory.createProxmoxVMService()`
  - [x] Handle interactive mode (no VMIDs provided):
    - [x] List all VMs using service
    - [x] Display "No VMs available to delete" if list is empty
    - [x] Use `promptForMultipleSelections` to let user select VMs
    - [x] Extract VMIDs from selected VMs
  - [x] Validate force flag requirements:
    - [x] If `--force` and no VMIDs: error "Force mode requires explicit VM IDs"
  - [x] Load VM details for specified VMIDs
  - [x] Check all VMs exist (return error for any not found)
  - [x] Display VM details table (VMID, Name, Node, Status)
  - [x] Show confirmation prompt (skip if `--force`):
    - [x] Use `promptForConfirmation` with warning message
    - [x] Message: "Are you sure you want to delete these VMs? This action cannot be undone."
    - [x] If user cancels, display "Deletion cancelled" and exit 0
  - [x] Delete VMs sequentially:
    - [x] Show progress for multiple VMs: "[1/3] Deleting VM 100..."
    - [x] Call service.deleteVM(vmid) for each
    - [x] Collect results (successful and failed)
    - [x] Continue on error (don't stop batch)
  - [x] Display results:
    - [x] Success message for each deleted VM
    - [x] Error message for each failed VM
    - [x] Summary for multiple VMs (X successful, Y failed)
  - [x] Handle JSON output mode:
    - [x] Return structured JSON for single VM
    - [x] Return {deleted: [...], failed: [...]} for multiple VMs
    - [x] Suppress progress messages in JSON mode
  - [x] Exit with code 0 if all succeed, code 1 if any fail
- [x] Verify TypeScript compilation: `pnpm run build`
- [x] Test command help: `./bin/dev.js proxmox vm delete --help`

### Task 4.2: Test ProxmoxVmDelete command
- [x] Create file `test/commands/proxmox/vm/delete.test.ts`
- [x] Add test suite for `ProxmoxVmDelete`:
  - [x] Test single VM deletion with confirmation accepted
  - [x] Test single VM deletion with confirmation rejected (cancelled)
  - [x] Test multiple VM deletion (all succeed)
  - [x] Test multiple VM deletion (some fail, some succeed)
  - [x] Test `--force` flag skips confirmation
  - [x] Test `--force` without VMIDs returns error
  - [x] Test interactive selection mode (no VMIDs provided)
  - [x] Test interactive mode with no VMs available
  - [x] Test VM not found error
  - [x] Test permission error handling
  - [x] Test JSON output mode (single VM success)
  - [x] Test JSON output mode (multiple VMs)
  - [x] Test JSON output mode (error)
  - [x] Test progress display for multiple VMs
  - [x] Test table format for VM details display
- [x] Mock service using factory pattern or dependency injection
- [x] Mock prompts (promptForConfirmation, promptForMultipleSelections)
- [x] Run command tests: `pnpm exec mocha --forbid-only "test/commands/proxmox/vm/delete.test.ts"`
- [x] Verify all tests pass

## Phase 5: Integration and Documentation

### Task 5.1: Manual integration testing
- [x] Build project: `pnpm run build`
- [x] Set up test Proxmox environment or use existing
- [x] Create test VMs for deletion testing
- [x] Test single VM deletion:
  - [x] Run `./bin/dev.js proxmox vm delete <test-vmid>`
  - [x] Verify VM details displayed correctly
  - [x] Verify confirmation prompt appears
  - [x] Confirm deletion and verify success message
  - [x] Verify VM is actually deleted in Proxmox
- [x] Test multiple VM deletion:
  - [x] Create multiple test VMs
  - [x] Run `./bin/dev.js proxmox vm delete <vmid1> <vmid2> <vmid3>`
  - [x] Verify all VMs shown in table
  - [x] Verify progress display
  - [x] Verify all VMs deleted
- [x] Test force flag:
  - [x] Run `./bin/dev.js proxmox vm delete <vmid> --force`
  - [x] Verify no confirmation prompt
  - [x] Verify immediate deletion
- [x] Test interactive mode:
  - [x] Run `./bin/dev.js proxmox vm delete`
  - [x] Verify VM list displayed
  - [x] Select VMs interactively
  - [x] Verify confirmation and deletion
- [x] Test JSON output:
  - [x] Run `./bin/dev.js proxmox vm delete <vmid> --json --force`
  - [x] Verify valid JSON output
  - [x] Verify no progress messages
- [x] Test error scenarios:
  - [x] Try deleting non-existent VM
  - [x] Verify clear error message
  - [x] Try without permissions (if possible)
- [x] Document any issues found

### Task 5.2: Update README
- [x] Run `pnpm run prepack` to regenerate README
- [x] Verify README includes new command:
  - [x] `homelab proxmox vm delete` listed in commands
  - [x] Description is accurate
  - [x] Examples are present
- [x] Verify manifest.json generated correctly
- [x] Commit README changes

### Task 5.3: Run full test suite and linter
- [x] Run full test suite: `pnpm test`
  - [x] Verify all tests pass (not just new ones)
  - [x] Check for any test regressions
- [x] Run linter: `pnpm run lint`
  - [x] Fix any linting issues
  - [x] Verify no warnings
- [x] Run TypeScript compiler check: `tsc --noEmit`
  - [x] Fix any type errors
  - [x] Verify strict mode compliance

## Phase 6: Finalization

### Task 6.1: Review and refine error messages
- [x] Review all error messages for clarity:
  - [x] VM not found error includes suggestion to run `list` command
  - [x] Permission errors explain how to check credentials
  - [x] Network errors mention checking PROXMOX_HOST configuration
- [x] Verify no sensitive data exposed in errors:
  - [x] No API tokens in messages
  - [x] No full stack traces to users
  - [x] No internal implementation details
- [x] Test error messages with real scenarios
- [x] Update messages if needed

### Task 6.2: Code review checklist
- [x] Self-review code against architecture guidelines:
  - [x] Follows layered architecture pattern
  - [x] Commands are thin, business logic in service
  - [x] Repository handles only data access
  - [x] Uses Result pattern consistently
  - [x] Error handling is comprehensive
  - [x] Tests cover all scenarios
  - [x] Documentation is clear and complete
  - [x] No hardcoded values (use config)
  - [x] Debug logging added appropriately
  - [x] Follows existing code style
  - [x] Uses dependency injection via factory
  - [x] JSDoc comments on all public methods
  - [x] Type safety maintained throughout
- [x] Check for code duplication
- [x] Verify consistent naming conventions
- [x] Review for potential edge cases

### Task 6.3: Final validation
- [x] Run `openspec validate add-proxmox-vm-delete-command --strict`
- [x] Verify no validation errors
- [x] Verify all spec requirements implemented
- [x] Check all scenarios covered in tests
- [x] Confirm proposal deliverables met

## Validation Criteria

- [x] All unit tests passing (prompts, repository, service)
- [x] All integration tests passing (command)
- [x] All manual test scenarios successful
- [x] Build succeeds without errors: `pnpm run build`
- [x] Linter passes without warnings: `pnpm run lint`
- [x] TypeScript compiler passes: `tsc --noEmit`
- [x] Command displays VM details before confirmation
- [x] Confirmation prompt shows clear warning
- [x] Force flag skips all prompts
- [x] Interactive mode lists and allows VM selection
- [x] Multiple VM deletion shows progress
- [x] JSON output mode works correctly
- [x] Errors display user-friendly messages and exit with code 1
- [x] Success messages include VM name and node
- [x] Code follows layered architecture pattern
- [x] All dependencies explicit via constructor injection
- [x] Result pattern used consistently across layers
- [x] Debug logging works when enabled
- [x] No sensitive data in error messages or logs
- [x] README updated with new command
- [x] Help text is clear and includes examples
- [x] OpenSpec validation passes with --strict
- [x] No regressions in existing commands
- [x] Confirmation prompt is reusable for other commands

## Notes

**Parallelizable Work**:
- Phase 1 (Confirmation Prompt) can be developed independently
- Once Phase 2 completes, Phases 3-4 can proceed in parallel with mocking

**Critical Path**:
- Confirmation prompt (Phase 1) → Command layer (Phase 4)
- Repository (Phase 2) → Service (Phase 3) → Command (Phase 4)

**Testing Strategy**:
- Unit tests for each layer with mocked dependencies
- Integration tests for full command execution
- Manual testing with real Proxmox environment required

**Safety Measures**:
- Confirmation prompt prevents accidental deletions (default behavior)
- Force flag requires explicit VMIDs (prevents mass deletion accidents)
- VM details shown before confirmation (transparency)
- Clear warning messages throughout
