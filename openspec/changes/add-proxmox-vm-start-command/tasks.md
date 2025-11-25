# Implementation Tasks: Proxmox VM Start Command

## Overview
This document outlines the implementation tasks for adding VM start capability to the homelab-cli. Tasks are ordered to deliver incremental, testable progress.

## Phase 1: Repository Layer

### Task 1: Extend Repository Interface
**Goal**: Add startVM method signature to IProxmoxRepository interface

- [ ] Open `src/repositories/interfaces/proxmox.repository.interface.ts`
- [ ] Add method signature: `startVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>`
- [ ] Add JSDoc comment documenting the method's purpose and parameters
- [ ] Verify TypeScript compilation succeeds
- [ ] Verify interface properly declares the new method

**Dependencies**: None

---

### Task 2: Implement Repository startVM Method
**Goal**: Implement startVM in ProxmoxApiRepository using proxmox-api package

- [ ] Open `src/repositories/proxmox-api.repository.ts`
- [ ] Implement `startVM(node: string, vmid: number)` method
  - [ ] Construct tokenID from user@realm!tokenKey format
  - [ ] Handle SSL verification based on config (rejectUnauthorized)
  - [ ] Create proxmox client with token authentication
  - [ ] Call API: `proxmox.nodes.$(node).qemu.$(vmid).status.start.$post()`
  - [ ] Wrap API call in try/catch block
  - [ ] Use logDebugError for error cases with context
  - [ ] Return Result<string, RepositoryError> with task UPID or error
  - [ ] Handle specific error cases (VM not found, API unreachable)
- [ ] Follow existing patterns from deleteVM and cloneFromTemplate methods
- [ ] Verify method compiles without errors
- [ ] Verify returns task UPID on success
- [ ] Verify includes debug logging for errors

**Dependencies**: Task 1

---

### Task 3: Write Repository Tests
**Goal**: Test repository startVM implementation

- [ ] Create or update `test/repositories/proxmox-api.repository.test.ts`
- [ ] Add test: successful VM start (mocked API response)
  - [ ] Mock proxmox-api client
  - [ ] Verify API endpoint called correctly
  - [ ] Verify task UPID returned
- [ ] Add test: VM not found error handling
  - [ ] Mock API error response
  - [ ] Verify RepositoryError returned
  - [ ] Verify error message is descriptive
- [ ] Add test: network error handling
  - [ ] Mock network failure
  - [ ] Verify error wrapped in RepositoryError
  - [ ] Verify cause chain preserved
- [ ] Add test: error context includes node and vmid
  - [ ] Verify error context has required fields
  - [ ] Verify debug logging called with correct parameters
- [ ] Run repository tests: `pnpm exec mocha --forbid-only "test/repositories/proxmox-api.repository.test.ts"`
- [ ] Verify all tests pass
- [ ] Verify test coverage includes success and error paths

**Dependencies**: Task 2

---

## Phase 2: Service Layer

### Task 4: Add Service Layer startVM Method
**Goal**: Add business logic for starting VMs in ProxmoxVMService

- [ ] Open `src/services/proxmox-vm.service.ts`
- [ ] Add method signature: `startVM(vmid: number): Promise<Result<{vmid: number, name: string, node: string}, ServiceError>>`
- [ ] Implement method logic:
  - [ ] Call `this.repository.listResources('qemu')` to find VM and its node
  - [ ] Search returned VMs for matching vmid
  - [ ] If VM not in list, return ServiceError with "VM not found" message
  - [ ] Extract VM details (name, node) from found VM
  - [ ] Call `this.repository.startVM(node, vmid)`
  - [ ] If repository returns error, wrap in ServiceError
  - [ ] Include original error as cause
  - [ ] Return success Result with VM details (vmid, name, node)
- [ ] Follow existing patterns from deleteVM method in ProxmoxVMService
- [ ] Verify method compiles without errors
- [ ] Verify returns ServiceError when VM not found
- [ ] Verify wraps RepositoryError in ServiceError

**Dependencies**: Task 3

---

### Task 5: Write Service Tests
**Goal**: Test service startVM with mocked repository

- [ ] Create or update `test/services/proxmox-vm.service.test.ts`
- [ ] Create mock IProxmoxRepository for testing
  - [ ] Mock listResources method
  - [ ] Mock startVM method
- [ ] Add test: successful VM start flow
  - [ ] Mock repository returns VM in list
  - [ ] Mock repository startVM succeeds
  - [ ] Verify service returns success with VM details
- [ ] Add test: VM not found (not in list)
  - [ ] Mock repository returns empty list or list without target VM
  - [ ] Verify service returns ServiceError
  - [ ] Verify error message mentions VM not found
- [ ] Add test: repository error propagation
  - [ ] Mock repository startVM returns error
  - [ ] Verify service wraps error in ServiceError
  - [ ] Verify cause chain preserved
- [ ] Add test: verify error messages are user-friendly
  - [ ] Check error messages don't expose internal details
  - [ ] Verify actionable guidance provided
- [ ] Run service tests: `pnpm exec mocha --forbid-only "test/services/proxmox-vm.service.test.ts"`
- [ ] Verify all service tests pass
- [ ] Verify service properly orchestrates repository calls

**Dependencies**: Task 4

---

## Phase 3: Command Layer

### Task 6: Create Command File Structure
**Goal**: Create command file with basic structure

- [ ] Create file `src/commands/proxmox/vm/start.ts`
- [ ] Import required dependencies:
  - [ ] Import `{Args, Flags}` from '@oclif/core'
  - [ ] Import `BaseCommand` from '../../../lib/base-command.js'
  - [ ] Import `ProxmoxVMFactory` from '../../../factories/proxmox-vm.factory.js'
  - [ ] Import `promptForMultipleSelections` from '../../../utils/prompts.js'
  - [ ] Import `Table` from 'cli-table3'
- [ ] Define class `ProxmoxVmStart extends BaseCommand<typeof ProxmoxVmStart>`
- [ ] Add static properties:
  - [ ] Add `description = 'Start one or more stopped Proxmox VMs'`
  - [ ] Add `examples` array with sample invocations and output
  - [ ] Add `flags` object (initially empty, will add --json support later)
  - [ ] Add `args` object with variadic vmids
  - [ ] Add `strict = false` for variadic args support
- [ ] Implement empty `async run()` method with proper return type
- [ ] Verify file compiles without errors: `pnpm run build`
- [ ] Verify command structure follows existing patterns (delete.ts, create.ts)

**Dependencies**: Task 5

---

### Task 7: Implement Command Direct VM ID Mode
**Goal**: Support starting VMs by specifying VM IDs as arguments

- [ ] In `run()` method, implement argument parsing:
  - [ ] Parse variadic VM IDs from `this.argv`
  - [ ] Convert arguments to integers using `Number.parseInt(arg, 10)`
  - [ ] Filter out any NaN values
  - [ ] Store parsed VMIDs in `providedVmids` array
- [ ] Get service instance: `ProxmoxVMFactory.createProxmoxVMService()`
- [ ] Check `this.jsonEnabled()` to determine output mode
- [ ] Implement direct VM ID mode (when VMIDs provided):
  - [ ] Call `service.listVMs('qemu')` to get all VMs
  - [ ] Validate all provided VMIDs exist in the list
  - [ ] Display error for any VM IDs not found with exit code 1
  - [ ] Create vmidsToStart array from valid VMIDs
  - [ ] Initialize `started` and `failed` result arrays
  - [ ] Loop through vmidsToStart sequentially (await in loop)
  - [ ] For each VM, call `service.startVM(vmid)`
  - [ ] Display progress: "[1/3] Starting VM 100 'vm-name' on node 'pve'..."
  - [ ] Collect success results in `started` array
  - [ ] Collect failure results in `failed` array
  - [ ] For single VM, display immediate success/error message
  - [ ] For multiple VMs, display summary with successful/failed counts
  - [ ] If JSON mode active, return structured JSON response
  - [ ] Exit with code 1 if any VMs failed to start
- [ ] Test manually: `./bin/dev.js proxmox vm start 100`
- [ ] Test manually: `./bin/dev.js proxmox vm start 100 101 102`
- [ ] Verify appropriate error for invalid VM IDs
- [ ] Verify proper exit codes

**Dependencies**: Task 6

---

### Task 8: Implement Command Interactive Mode
**Goal**: Support interactive VM selection when no VM IDs provided

- [ ] In `run()` method, handle case where `providedVmids.length === 0`
- [ ] Implement interactive mode logic:
  - [ ] Call `service.listVMs('qemu')` to get all VMs
  - [ ] Handle service error (display error and exit 1)
  - [ ] Filter VMs where `status === 'stopped'`
  - [ ] If no stopped VMs, display "No stopped VMs available to start"
  - [ ] If no stopped VMs, return/exit with code 0
  - [ ] Build choices array for promptForMultipleSelections:
    - [ ] Format: `{label: '{vmid} - {name} ({node}, {status})', value: vmid}`
    - [ ] Include all stopped VMs
  - [ ] Call `promptForMultipleSelections()` with choices
  - [ ] Set message: "Select VMs to start (use space to toggle, enter to confirm):"
  - [ ] Handle selection cancellation gracefully (display "Selection cancelled", exit 0)
  - [ ] Extract selected VMIDs from result
  - [ ] If no VMs selected, display message and return
  - [ ] Proceed with selected VMIDs using existing start logic from Task 7
- [ ] Test manually: `./bin/dev.js proxmox vm start` (interactive mode)
- [ ] Verify only stopped VMs shown in selection list
- [ ] Verify empty selection handled gracefully
- [ ] Verify cancellation (Ctrl+C) handled gracefully

**Dependencies**: Task 7

---

### Task 9: Implement JSON Output Mode
**Goal**: Support --json flag for machine-readable output

- [ ] Add return type to `run()` method for JSON responses:
  - [ ] Single VM: `{vmid: number, name: string, node: string, status: string}`
  - [ ] Multiple VMs: `{started: Array<{...}>, failed: Array<{...}>}`
- [ ] Implement JSON mode checks:
  - [ ] Check `this.jsonEnabled()` at start of run
  - [ ] If JSON mode and no VM IDs, display error "JSON mode requires explicit VM IDs"
  - [ ] Exit with code 1 for JSON + no args error
  - [ ] Disable interactive prompts when JSON mode active
- [ ] Implement JSON output for single VM:
  - [ ] Return object: `{vmid, name, node, status: 'started'}`
  - [ ] Suppress human-readable messages when JSON active
- [ ] Implement JSON output for multiple VMs:
  - [ ] Return object: `{started: [...], failed: [...]}`
  - [ ] Include VM details for each started VM
  - [ ] Include vmid and error message for each failed VM
- [ ] Implement JSON output for failures:
  - [ ] Return same structure with populated `failed` array
  - [ ] Exit with code 1 if any failures
- [ ] Test manually: `./bin/dev.js proxmox vm start 100 --json`
- [ ] Verify valid JSON structure returned
- [ ] Verify errors handled in JSON format
- [ ] Verify no human-readable messages in JSON mode

**Dependencies**: Task 8

---

### Task 10: Write Command Tests
**Goal**: Comprehensive command-level tests

- [ ] Create file `test/commands/proxmox/vm/start.test.ts`
- [ ] Import `runCommand` from '@oclif/test'
- [ ] Import testing utilities (expect, etc.)
- [ ] Add test: single VM start
  - [ ] Mock service to return success
  - [ ] Run command with single VM ID
  - [ ] Verify output contains success message
  - [ ] Verify exit code 0
- [ ] Add test: multiple VM start
  - [ ] Mock service for multiple VMs
  - [ ] Run command with multiple VM IDs
  - [ ] Verify progress messages displayed
  - [ ] Verify summary displayed
  - [ ] Verify exit code 0
- [ ] Add test: VM not found error
  - [ ] Mock service to return VM not found
  - [ ] Run command with invalid VM ID
  - [ ] Verify error message displayed
  - [ ] Verify exit code 1
- [ ] Add test: interactive mode behavior
  - [ ] May need mocking for prompts
  - [ ] Verify stopped VMs filtered correctly
  - [ ] Verify selection prompt displayed
- [ ] Add test: JSON output format
  - [ ] Run command with --json flag
  - [ ] Parse JSON output
  - [ ] Verify structure matches spec
  - [ ] Verify no extra text output
- [ ] Add test: JSON mode without VM IDs
  - [ ] Run command with --json but no VM IDs
  - [ ] Verify error message
  - [ ] Verify exit code 1
- [ ] Add test: verify exit codes for various scenarios
  - [ ] Success: exit 0
  - [ ] Failure: exit 1
  - [ ] Cancellation: exit 0
- [ ] Run command tests: `pnpm exec mocha --forbid-only "test/commands/proxmox/vm/start.test.ts"`
- [ ] Verify all command tests pass
- [ ] Verify tests cover success and error scenarios

**Dependencies**: Task 9

---

## Phase 4: Integration & Documentation

### Task 11: Build and Full Test Suite
**Goal**: Ensure all tests pass and code builds

- [ ] Run full build: `pnpm run build`
  - [ ] Verify build succeeds without errors
  - [ ] Verify no TypeScript compilation errors
  - [ ] Check dist/ directory for compiled command
- [ ] Run all tests: `pnpm test`
  - [ ] Verify all repository tests pass
  - [ ] Verify all service tests pass
  - [ ] Verify all command tests pass
  - [ ] Fix any failing tests
- [ ] Run linter: `pnpm run lint`
  - [ ] Verify no linting errors
  - [ ] Verify no linting warnings
  - [ ] Fix any linting issues
- [ ] Run TypeScript check: `tsc --noEmit`
  - [ ] Verify no type errors

**Dependencies**: Task 10

---

### Task 12: Update README Documentation
**Goal**: Generate updated README with new command

- [ ] Run: `pnpm run prepack`
  - [ ] This runs `oclif manifest`
  - [ ] This runs `oclif readme`
- [ ] Verify README includes new command section
  - [ ] Check `proxmox vm start` appears in command list
  - [ ] Verify command description is clear
  - [ ] Verify examples are included
- [ ] Review generated help text
  - [ ] Run `./bin/dev.js proxmox vm start --help`
  - [ ] Verify help text is clear and accurate
  - [ ] Verify examples are helpful
- [ ] Verify README formatting is correct
  - [ ] No broken links
  - [ ] Proper markdown formatting
  - [ ] Table of contents updated

**Dependencies**: Task 11

---

### Task 13: Manual Testing
**Goal**: Verify command works with real Proxmox instance

- [ ] Ensure PROXMOX_* environment variables are set
  - [ ] PROXMOX_USER
  - [ ] PROXMOX_REALM
  - [ ] PROXMOX_TOKEN_KEY
  - [ ] PROXMOX_TOKEN_SECRET
  - [ ] PROXMOX_HOST
- [ ] Test starting a single stopped VM:
  - [ ] Find a stopped VM: `./bin/dev.js proxmox vm list`
  - [ ] Start it: `./bin/dev.js proxmox vm start <vmid>`
  - [ ] Verify success message displayed
  - [ ] Verify VM actually starts in Proxmox
- [ ] Test starting multiple VMs:
  - [ ] Start multiple VMs: `./bin/dev.js proxmox vm start <vmid1> <vmid2>`
  - [ ] Verify progress messages for each VM
  - [ ] Verify summary displayed
  - [ ] Verify all VMs actually started
- [ ] Test interactive mode with stopped VMs:
  - [ ] Run: `./bin/dev.js proxmox vm start`
  - [ ] Verify only stopped VMs shown
  - [ ] Select one or more VMs
  - [ ] Confirm selection
  - [ ] Verify VMs start
- [ ] Test error cases:
  - [ ] Test with invalid VM ID (VM doesn't exist)
  - [ ] Verify error message is clear
  - [ ] Test with network issues (disconnect from Proxmox)
  - [ ] Verify error message is helpful
  - [ ] Test starting already running VM
  - [ ] Verify graceful handling
- [ ] Test JSON output mode:
  - [ ] Run: `./bin/dev.js proxmox vm start <vmid> --json`
  - [ ] Verify JSON output is valid
  - [ ] Parse JSON and verify structure
  - [ ] Verify no human-readable text mixed in
- [ ] Test edge cases:
  - [ ] No stopped VMs available (all running)
  - [ ] Empty cluster (no VMs)
  - [ ] Large number of VMs (10+)
- [ ] Verify progress messages and summary output are clear
- [ ] Verify user experience is smooth

**Dependencies**: Task 12

---

## Phase 5: Final Validation

- [ ] Ensure all unit tests pass: `pnpm test`
- [ ] Ensure build succeeds: `pnpm run build`
- [ ] Ensure linter passes: `pnpm run lint`
- [ ] Verify no TypeScript errors: `tsc --noEmit`
- [ ] Run command end-to-end with real Proxmox API
- [ ] Review code against project conventions:
  - [ ] Follows layered architecture pattern
  - [ ] Uses Result pattern consistently
  - [ ] Proper error handling at all layers
  - [ ] Debug logging included in repository
  - [ ] User-friendly error messages in command layer
  - [ ] Sequential operations for multiple VMs
  - [ ] Proper use of BaseCommand
- [ ] Verify all success criteria from proposal.md are met:
  - [ ] Can start single VM by ID
  - [ ] Can start multiple VMs by ID
  - [ ] Interactive mode works and shows only stopped VMs
  - [ ] Clear error messages for invalid VM IDs
  - [ ] JSON output mode works correctly
  - [ ] All tests pass
  - [ ] README documentation updated
- [ ] Update proposal status to complete
- [ ] Move proposal to archive if applicable

---

## Validation Criteria

- [ ] All unit tests passing (repository, service layers)
- [ ] All integration tests passing (command layer)
- [ ] Build succeeds without errors
- [ ] Linter passes without warnings
- [ ] Command starts VMs successfully
- [ ] Interactive mode filters stopped VMs correctly
- [ ] JSON output format matches specification
- [ ] Errors display user-friendly messages and exit with code 1
- [ ] Success cases exit with code 0
- [ ] Multiple VMs handled sequentially with progress display
- [ ] Code follows layered architecture pattern
- [ ] All dependencies explicit via constructor injection
- [ ] Result pattern used consistently across layers
- [ ] Repository includes debug logging
- [ ] Service wraps repository errors appropriately
- [ ] Command provides clear user feedback

---

## Parallelizable Work

The following tasks can be worked on in parallel:

- **Tasks 1-3** (repository layer) can proceed independently
- **Tasks 4-5** (service layer) can start once Task 1 (interface) is complete
- **Task 6** (command structure) can be created early while waiting for service layer
- **Tasks 7-9** (command implementation) must be sequential but can overlap with testing
- **Task 10** (command tests) can be written alongside Tasks 7-9

## Notes

- Sequential VM start operations are intentional to avoid overwhelming the Proxmox API
- The `await` in loop pattern is explicitly allowed for this use case
- Interactive mode should only show VMs with `status === 'stopped'`
- JSON mode and interactive mode are mutually exclusive
- Error messages should guide users to discover available VMs via `homelab proxmox vm list`
