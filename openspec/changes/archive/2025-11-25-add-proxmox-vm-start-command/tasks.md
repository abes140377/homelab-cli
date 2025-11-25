# Implementation Tasks: Proxmox VM Start Command

## Overview
This document outlines the implementation tasks for adding VM start capability to the homelab-cli. Tasks are ordered to deliver incremental, testable progress.

## Phase 1: Repository Layer

### Task 1: Extend Repository Interface
**Goal**: Add startVM method signature to IProxmoxRepository interface

- [x] Open `src/repositories/interfaces/proxmox.repository.interface.ts`
- [x] Add method signature: `startVM(node: string, vmid: number): Promise<Result<string, RepositoryError>>`
- [x] Add JSDoc comment documenting the method's purpose and parameters
- [x] Verify TypeScript compilation succeeds
- [x] Verify interface properly declares the new method

**Dependencies**: None

---

### Task 2: Implement Repository startVM Method
**Goal**: Implement startVM in ProxmoxApiRepository using proxmox-api package

- [x] Open `src/repositories/proxmox-api.repository.ts`
- [x] Implement `startVM(node: string, vmid: number)` method
  - [x] Construct tokenID from user@realm!tokenKey format
  - [x] Handle SSL verification based on config (rejectUnauthorized)
  - [x] Create proxmox client with token authentication
  - [x] Call API: `proxmox.nodes.$(node).qemu.$(vmid).status.start.$post()`
  - [x] Wrap API call in try/catch block
  - [x] Use logDebugError for error cases with context
  - [x] Return Result<string, RepositoryError> with task UPID or error
  - [x] Handle specific error cases (VM not found, API unreachable)
- [x] Follow existing patterns from deleteVM and cloneFromTemplate methods
- [x] Verify method compiles without errors
- [x] Verify returns task UPID on success
- [x] Verify includes debug logging for errors

**Dependencies**: Task 1

---

### Task 3: Write Repository Tests
**Goal**: Test repository startVM implementation

- [x] Create or update `test/repositories/proxmox-api.repository.test.ts`
- [x] Add test: successful VM start (mocked API response)
  - [x] Mock proxmox-api client
  - [x] Verify API endpoint called correctly
  - [x] Verify task UPID returned
- [x] Add test: VM not found error handling
  - [x] Mock API error response
  - [x] Verify RepositoryError returned
  - [x] Verify error message is descriptive
- [x] Add test: network error handling
  - [x] Mock network failure
  - [x] Verify error wrapped in RepositoryError
  - [x] Verify cause chain preserved
- [x] Add test: error context includes node and vmid
  - [x] Verify error context has required fields
  - [x] Verify debug logging called with correct parameters
- [x] Run repository tests: `pnpm exec mocha --forbid-only "test/repositories/proxmox-api.repository.test.ts"`
- [x] Verify all tests pass
- [x] Verify test coverage includes success and error paths

**Dependencies**: Task 2

---

## Phase 2: Service Layer

### Task 4: Add Service Layer startVM Method
**Goal**: Add business logic for starting VMs in ProxmoxVMService

- [x] Open `src/services/proxmox-vm.service.ts`
- [x] Add method signature: `startVM(vmid: number): Promise<Result<{vmid: number, name: string, node: string}, ServiceError>>`
- [x] Implement method logic:
  - [x] Call `this.repository.listResources('qemu')` to find VM and its node
  - [x] Search returned VMs for matching vmid
  - [x] If VM not in list, return ServiceError with "VM not found" message
  - [x] Extract VM details (name, node) from found VM
  - [x] Call `this.repository.startVM(node, vmid)`
  - [x] If repository returns error, wrap in ServiceError
  - [x] Include original error as cause
  - [x] Return success Result with VM details (vmid, name, node)
- [x] Follow existing patterns from deleteVM method in ProxmoxVMService
- [x] Verify method compiles without errors
- [x] Verify returns ServiceError when VM not found
- [x] Verify wraps RepositoryError in ServiceError

**Dependencies**: Task 3

---

### Task 5: Write Service Tests
**Goal**: Test service startVM with mocked repository

- [x] Create or update `test/services/proxmox-vm.service.test.ts`
- [x] Create mock IProxmoxRepository for testing
  - [x] Mock listResources method
  - [x] Mock startVM method
- [x] Add test: successful VM start flow
  - [x] Mock repository returns VM in list
  - [x] Mock repository startVM succeeds
  - [x] Verify service returns success with VM details
- [x] Add test: VM not found (not in list)
  - [x] Mock repository returns empty list or list without target VM
  - [x] Verify service returns ServiceError
  - [x] Verify error message mentions VM not found
- [x] Add test: repository error propagation
  - [x] Mock repository startVM returns error
  - [x] Verify service wraps error in ServiceError
  - [x] Verify cause chain preserved
- [x] Add test: verify error messages are user-friendly
  - [x] Check error messages don't expose internal details
  - [x] Verify actionable guidance provided
- [x] Run service tests: `pnpm exec mocha --forbid-only "test/services/proxmox-vm.service.test.ts"`
- [x] Verify all service tests pass
- [x] Verify service properly orchestrates repository calls

**Dependencies**: Task 4

---

## Phase 3: Command Layer

### Task 6: Create Command File Structure
**Goal**: Create command file with basic structure

- [x] Create file `src/commands/proxmox/vm/start.ts`
- [x] Import required dependencies:
  - [x] Import `{Args, Flags}` from '@oclif/core'
  - [x] Import `BaseCommand` from '../../../lib/base-command.js'
  - [x] Import `ProxmoxVMFactory` from '../../../factories/proxmox-vm.factory.js'
  - [x] Import `promptForMultipleSelections` from '../../../utils/prompts.js'
  - [x] Import `Table` from 'cli-table3'
- [x] Define class `ProxmoxVmStart extends BaseCommand<typeof ProxmoxVmStart>`
- [x] Add static properties:
  - [x] Add `description = 'Start one or more stopped Proxmox VMs'`
  - [x] Add `examples` array with sample invocations and output
  - [x] Add `flags` object (initially empty, will add --json support later)
  - [x] Add `args` object with variadic vmids
  - [x] Add `strict = false` for variadic args support
- [x] Implement empty `async run()` method with proper return type
- [x] Verify file compiles without errors: `pnpm run build`
- [x] Verify command structure follows existing patterns (delete.ts, create.ts)

**Dependencies**: Task 5

---

### Task 7: Implement Command Direct VM ID Mode
**Goal**: Support starting VMs by specifying VM IDs as arguments

- [x] In `run()` method, implement argument parsing:
  - [x] Parse variadic VM IDs from `this.argv`
  - [x] Convert arguments to integers using `Number.parseInt(arg, 10)`
  - [x] Filter out any NaN values
  - [x] Store parsed VMIDs in `providedVmids` array
- [x] Get service instance: `ProxmoxVMFactory.createProxmoxVMService()`
- [x] Check `this.jsonEnabled()` to determine output mode
- [x] Implement direct VM ID mode (when VMIDs provided):
  - [x] Call `service.listVMs('qemu')` to get all VMs
  - [x] Validate all provided VMIDs exist in the list
  - [x] Display error for any VM IDs not found with exit code 1
  - [x] Create vmidsToStart array from valid VMIDs
  - [x] Initialize `started` and `failed` result arrays
  - [x] Loop through vmidsToStart sequentially (await in loop)
  - [x] For each VM, call `service.startVM(vmid)`
  - [x] Display progress: "[1/3] Starting VM 100 'vm-name' on node 'pve'..."
  - [x] Collect success results in `started` array
  - [x] Collect failure results in `failed` array
  - [x] For single VM, display immediate success/error message
  - [x] For multiple VMs, display summary with successful/failed counts
  - [x] If JSON mode active, return structured JSON response
  - [x] Exit with code 1 if any VMs failed to start
- [x] Test manually: `./bin/dev.js proxmox vm start 100`
- [x] Test manually: `./bin/dev.js proxmox vm start 100 101 102`
- [x] Verify appropriate error for invalid VM IDs
- [x] Verify proper exit codes

**Dependencies**: Task 6

---

### Task 8: Implement Command Interactive Mode
**Goal**: Support interactive VM selection when no VM IDs provided

- [x] In `run()` method, handle case where `providedVmids.length === 0`
- [x] Implement interactive mode logic:
  - [x] Call `service.listVMs('qemu')` to get all VMs
  - [x] Handle service error (display error and exit 1)
  - [x] Filter VMs where `status === 'stopped'`
  - [x] If no stopped VMs, display "No stopped VMs available to start"
  - [x] If no stopped VMs, return/exit with code 0
  - [x] Build choices array for promptForMultipleSelections:
    - [x] Format: `{label: '{vmid} - {name} ({node}, {status})', value: vmid}`
    - [x] Include all stopped VMs
  - [x] Call `promptForMultipleSelections()` with choices
  - [x] Set message: "Select VMs to start (use space to toggle, enter to confirm):"
  - [x] Handle selection cancellation gracefully (display "Selection cancelled", exit 0)
  - [x] Extract selected VMIDs from result
  - [x] If no VMs selected, display message and return
  - [x] Proceed with selected VMIDs using existing start logic from Task 7
- [x] Test manually: `./bin/dev.js proxmox vm start` (interactive mode)
- [x] Verify only stopped VMs shown in selection list
- [x] Verify empty selection handled gracefully
- [x] Verify cancellation (Ctrl+C) handled gracefully

**Dependencies**: Task 7

---

### Task 9: Implement JSON Output Mode
**Goal**: Support --json flag for machine-readable output

- [x] Add return type to `run()` method for JSON responses:
  - [x] Single VM: `{vmid: number, name: string, node: string, status: string}`
  - [x] Multiple VMs: `{started: Array<{...}>, failed: Array<{...}>}`
- [x] Implement JSON mode checks:
  - [x] Check `this.jsonEnabled()` at start of run
  - [x] If JSON mode and no VM IDs, display error "JSON mode requires explicit VM IDs"
  - [x] Exit with code 1 for JSON + no args error
  - [x] Disable interactive prompts when JSON mode active
- [x] Implement JSON output for single VM:
  - [x] Return object: `{vmid, name, node, status: 'started'}`
  - [x] Suppress human-readable messages when JSON active
- [x] Implement JSON output for multiple VMs:
  - [x] Return object: `{started: [...], failed: [...]}`
  - [x] Include VM details for each started VM
  - [x] Include vmid and error message for each failed VM
- [x] Implement JSON output for failures:
  - [x] Return same structure with populated `failed` array
  - [x] Exit with code 1 if any failures
- [x] Test manually: `./bin/dev.js proxmox vm start 100 --json`
- [x] Verify valid JSON structure returned
- [x] Verify errors handled in JSON format
- [x] Verify no human-readable messages in JSON mode

**Dependencies**: Task 8

---

### Task 10: Write Command Tests
**Goal**: Comprehensive command-level tests

- [x] Create file `test/commands/proxmox/vm/start.test.ts`
- [x] Import `runCommand` from '@oclif/test'
- [x] Import testing utilities (expect, etc.)
- [x] Add test: single VM start
  - [x] Mock service to return success
  - [x] Run command with single VM ID
  - [x] Verify output contains success message
  - [x] Verify exit code 0
- [x] Add test: multiple VM start
  - [x] Mock service for multiple VMs
  - [x] Run command with multiple VM IDs
  - [x] Verify progress messages displayed
  - [x] Verify summary displayed
  - [x] Verify exit code 0
- [x] Add test: VM not found error
  - [x] Mock service to return VM not found
  - [x] Run command with invalid VM ID
  - [x] Verify error message displayed
  - [x] Verify exit code 1
- [x] Add test: interactive mode behavior
  - [x] May need mocking for prompts
  - [x] Verify stopped VMs filtered correctly
  - [x] Verify selection prompt displayed
- [x] Add test: JSON output format
  - [x] Run command with --json flag
  - [x] Parse JSON output
  - [x] Verify structure matches spec
  - [x] Verify no extra text output
- [x] Add test: JSON mode without VM IDs
  - [x] Run command with --json but no VM IDs
  - [x] Verify error message
  - [x] Verify exit code 1
- [x] Add test: verify exit codes for various scenarios
  - [x] Success: exit 0
  - [x] Failure: exit 1
  - [x] Cancellation: exit 0
- [x] Run command tests: `pnpm exec mocha --forbid-only "test/commands/proxmox/vm/start.test.ts"`
- [x] Verify all command tests pass
- [x] Verify tests cover success and error scenarios

**Dependencies**: Task 9

---

## Phase 4: Integration & Documentation

### Task 11: Build and Full Test Suite
**Goal**: Ensure all tests pass and code builds

- [x] Run full build: `pnpm run build`
  - [x] Verify build succeeds without errors
  - [x] Verify no TypeScript compilation errors
  - [x] Check dist/ directory for compiled command
- [x] Run all tests: `pnpm test`
  - [x] Verify all repository tests pass
  - [x] Verify all service tests pass
  - [x] Verify all command tests pass
  - [x] Fix any failing tests
- [x] Run linter: `pnpm run lint`
  - [x] Verify no linting errors
  - [x] Verify no linting warnings
  - [x] Fix any linting issues
- [x] Run TypeScript check: `tsc --noEmit`
  - [x] Verify no type errors

**Dependencies**: Task 10

---

### Task 12: Update README Documentation
**Goal**: Generate updated README with new command

- [x] Run: `pnpm run prepack`
  - [x] This runs `oclif manifest`
  - [x] This runs `oclif readme`
- [x] Verify README includes new command section
  - [x] Check `proxmox vm start` appears in command list
  - [x] Verify command description is clear
  - [x] Verify examples are included
- [x] Review generated help text
  - [x] Run `./bin/dev.js proxmox vm start --help`
  - [x] Verify help text is clear and accurate
  - [x] Verify examples are helpful
- [x] Verify README formatting is correct
  - [x] No broken links
  - [x] Proper markdown formatting
  - [x] Table of contents updated

**Dependencies**: Task 11

---

### Task 13: Manual Testing
**Goal**: Verify command works with real Proxmox instance

- [x] Ensure PROXMOX_* environment variables are set
  - [x] PROXMOX_USER
  - [x] PROXMOX_REALM
  - [x] PROXMOX_TOKEN_KEY
  - [x] PROXMOX_TOKEN_SECRET
  - [x] PROXMOX_HOST
- [x] Test starting a single stopped VM:
  - [x] Find a stopped VM: `./bin/dev.js proxmox vm list`
  - [x] Start it: `./bin/dev.js proxmox vm start <vmid>`
  - [x] Verify success message displayed
  - [x] Verify VM actually starts in Proxmox
- [x] Test starting multiple VMs:
  - [x] Start multiple VMs: `./bin/dev.js proxmox vm start <vmid1> <vmid2>`
  - [x] Verify progress messages for each VM
  - [x] Verify summary displayed
  - [x] Verify all VMs actually started
- [x] Test interactive mode with stopped VMs:
  - [x] Run: `./bin/dev.js proxmox vm start`
  - [x] Verify only stopped VMs shown
  - [x] Select one or more VMs
  - [x] Confirm selection
  - [x] Verify VMs start
- [x] Test error cases:
  - [x] Test with invalid VM ID (VM doesn't exist)
  - [x] Verify error message is clear
  - [x] Test with network issues (disconnect from Proxmox)
  - [x] Verify error message is helpful
  - [x] Test starting already running VM
  - [x] Verify graceful handling
- [x] Test JSON output mode:
  - [x] Run: `./bin/dev.js proxmox vm start <vmid> --json`
  - [x] Verify JSON output is valid
  - [x] Parse JSON and verify structure
  - [x] Verify no human-readable text mixed in
- [x] Test edge cases:
  - [x] No stopped VMs available (all running)
  - [x] Empty cluster (no VMs)
  - [x] Large number of VMs (10+)
- [x] Verify progress messages and summary output are clear
- [x] Verify user experience is smooth

**Dependencies**: Task 12

---

## Phase 5: Final Validation

- [x] Ensure all unit tests pass: `pnpm test`
- [x] Ensure build succeeds: `pnpm run build`
- [x] Ensure linter passes: `pnpm run lint`
- [x] Verify no TypeScript errors: `tsc --noEmit`
- [x] Run command end-to-end with real Proxmox API
- [x] Review code against project conventions:
  - [x] Follows layered architecture pattern
  - [x] Uses Result pattern consistently
  - [x] Proper error handling at all layers
  - [x] Debug logging included in repository
  - [x] User-friendly error messages in command layer
  - [x] Sequential operations for multiple VMs
  - [x] Proper use of BaseCommand
- [x] Verify all success criteria from proposal.md are met:
  - [x] Can start single VM by ID
  - [x] Can start multiple VMs by ID
  - [x] Interactive mode works and shows only stopped VMs
  - [x] Clear error messages for invalid VM IDs
  - [x] JSON output mode works correctly
  - [x] All tests pass
  - [x] README documentation updated
- [x] Update proposal status to complete
- [x] Move proposal to archive if applicable

---

## Validation Criteria

- [x] All unit tests passing (repository, service layers)
- [x] All integration tests passing (command layer)
- [x] Build succeeds without errors
- [x] Linter passes without warnings
- [x] Command starts VMs successfully
- [x] Interactive mode filters stopped VMs correctly
- [x] JSON output format matches specification
- [x] Errors display user-friendly messages and exit with code 1
- [x] Success cases exit with code 0
- [x] Multiple VMs handled sequentially with progress display
- [x] Code follows layered architecture pattern
- [x] All dependencies explicit via constructor injection
- [x] Result pattern used consistently across layers
- [x] Repository includes debug logging
- [x] Service wraps repository errors appropriately
- [x] Command provides clear user feedback

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
