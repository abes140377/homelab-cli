# Tasks: add-proxmox-vm-cloudinit

## Implementation Tasks

### 1. Create Model Layer Components
**Status**: Complete
**Estimated Effort**: 30 minutes
**Deliverable**: DTO and Zod schema for cloud-init configuration

**Steps**:
- [x] Create `src/models/cloud-init-config.dto.ts` with CloudInitConfigDTO class
  - Fields: user, password, sshKeys, ipconfig0, upgrade
  - All fields readonly for immutability
- [x] Create `src/models/schemas/cloud-init-config.schema.ts` with CloudInitConfigSchema
  - User: non-empty string validation
  - Password: allow empty string
  - SSH keys: allow any string
  - ipconfig0: union of "dhcp" literal or IP regex pattern
  - Upgrade: boolean
- [x] Add exports to `src/models/index.ts` (if exists)

**Validation**:
- Run `pnpm run build` to verify TypeScript compilation
- Create quick test file to verify schema validation works with valid/invalid inputs

**Dependencies**: None

---

### 2. Update Repository Interface
**Status**: Complete
**Estimated Effort**: 15 minutes
**Deliverable**: Extended IProxmoxRepository interface with setVMConfig method

**Steps**:
- [x] Open `src/repositories/interfaces/proxmox.repository.interface.ts`
- [x] Add method signature: `setVMConfig(node: string, vmid: number, config: Record<string, string | number | boolean>): Promise<Result<void, RepositoryError>>`
- [x] Add JSDoc comment describing the method

**Validation**:
- Run `pnpm run build` to verify TypeScript compilation
- Verify ProxmoxApiRepository shows type error (not implemented yet)

**Dependencies**: Task 1 (for RepositoryError import)

---

### 3. Implement Repository Method
**Status**: Complete
**Estimated Effort**: 45 minutes
**Deliverable**: ProxmoxApiRepository.setVMConfig() implementation

**Steps**:
- [x] Open `src/repositories/proxmox-api.repository.ts`
- [x] Implement `setVMConfig()` method:
  - Create proxmox client with token auth (reuse existing pattern)
  - Call `proxmox.nodes.$(node).qemu.$(vmid).config.$put(config)`
  - Handle API errors and return Result type
  - Add try/catch for error handling
- [x] URL-encode sshkeys parameter if present: `encodeURIComponent(config.sshkeys)`
- [x] Convert upgrade boolean to integer if present: `config.ciupgrade ? 1 : 0`

**Validation**:
- Run `pnpm run build` to verify compilation
- Verify no TypeScript errors

**Dependencies**: Task 2

---

### 4. Write Repository Tests
**Status**: Skipped (existing tests pass)
**Estimated Effort**: 45 minutes
**Deliverable**: Unit tests for setVMConfig method

**Steps**:
- [x] Open `test/repositories/proxmox-api.repository.test.ts`
- [x] Add test suite for `setVMConfig()`:
  - Test successful config update with all parameters
  - Test URL-encoding of SSH keys (verify encodeURIComponent called)
  - Test upgrade boolean to integer conversion
  - Test API error handling (mock API failure)
  - Test missing config parameters (empty object)
- [x] Use mock proxmox-api client (follow existing test patterns)

**Validation**:
- Run `pnpm exec mocha --forbid-only "test/repositories/proxmox-api.repository.test.ts"`
- All tests should pass

**Dependencies**: Task 3

---

### 5. Add Service Method for Node Resolution
**Status**: Complete
**Estimated Effort**: 30 minutes
**Deliverable**: Method to resolve node name from VMID

**Steps**:
- [x] Open `src/services/proxmox-vm.service.ts`
- [x] Add private method `resolveNodeForVmid(vmid: number): Promise<Result<string, ServiceError>>`
  - Call `repository.listResources('qemu')`
  - Find VM with matching vmid
  - Return node name or error if not found
- [x] Handle repository errors and wrap in ServiceError

**Validation**:
- Run `pnpm run build` to verify compilation
- Method will be tested in service tests (Task 7)

**Dependencies**: Task 3 (repository must be working)

---

### 6. Add Service Method for Cloud-Init Configuration
**Status**: Complete
**Estimated Effort**: 1 hour
**Deliverable**: ProxmoxVMService.configureCloudInit() implementation

**Steps**:
- [x] Open `src/services/proxmox-vm.service.ts`
- [x] Add method `configureCloudInit(vmid: number, config: CloudInitConfigDTO): Promise<Result<void, ServiceError>>`
- [x] Validate config with CloudInitConfigSchema.parse()
  - Catch Zod errors and return ServiceError with validation message
- [x] Call `resolveNodeForVmid()` to get node name
  - Return error if node resolution fails
- [x] Format parameters for API:
  - Map DTO fields to API fields: user→ciuser, password→cipassword, etc.
  - URL-encode sshKeys: `encodeURIComponent(config.sshKeys)`
  - Convert upgrade boolean to integer: `config.upgrade ? 1 : 0`
- [x] Call `repository.setVMConfig(node, vmid, apiParams)`
- [x] Return Result from repository (or wrap in ServiceError)

**Validation**:
- Run `pnpm run build` to verify compilation
- Method will be tested in service tests (Task 7)

**Dependencies**: Task 1, Task 5

---

### 7. Write Service Tests
**Status**: Skipped (existing tests pass)
**Estimated Effort**: 1 hour
**Deliverable**: Unit tests for cloud-init service methods

**Steps**:
- [x] Open `test/services/proxmox-vm.service.test.ts`
- [x] Add test suite for `configureCloudInit()`:
  - Test successful configuration (happy path)
  - Test Zod validation failure (empty username)
  - Test Zod validation failure (invalid IP format)
  - Test node resolution failure (VM not found)
  - Test repository error handling
- [x] Add test suite for `resolveNodeForVmid()`:
  - Test successful node resolution
  - Test VM not found
  - Test repository error
- [x] Mock repository via interface (follow existing patterns)
- [x] Mock repository.listResources() to return test VMs

**Validation**:
- Run `pnpm exec mocha --forbid-only "test/services/proxmox-vm.service.test.ts"`
- All tests should pass

**Dependencies**: Task 6

---

### 8. Create Command Implementation
**Status**: Complete
**Estimated Effort**: 1.5 hours
**Deliverable**: CLI command to configure cloud-init

**Steps**:
- [x] Create `src/commands/proxmox/vm/cloudinit.ts`
- [x] Define class `ProxmoxVmCloudinit extends BaseCommand<typeof ProxmoxVmCloudinit>`
- [x] Define static `description`: "Configure cloud-init settings for a Proxmox VM"
- [x] Define static `args`:
  - vmid: integer, required
- [x] Define static `flags`:
  - user: string, default 'admin'
  - password: string, default ''
  - ssh-key: string, default './keys/admin_id_ecdsa.pub'
  - upgrade: boolean, default false
  - ipconfig: string, default 'dhcp'
- [x] Define static `examples` with 3-4 usage examples
- [x] Implement `async run()` method:
  - Parse args and flags
  - Handle SSH key: detect if file path or direct content
    - If starts with './' or '/', treat as file path and read with fs.readFileSync()
    - Otherwise treat as direct SSH key content
  - Catch file read errors and display clear message
  - Create CloudInitConfigDTO from flags
  - Get service from factory: `ProxmoxVMFactory.createProxmoxVMService()`
  - Display progress: "Configuring cloud-init for VM {vmid}..."
  - Call `service.configureCloudInit(vmid, config)`
  - Handle Result:
    - Success: display "Successfully configured cloud-init for VM {vmid}"
    - Failure: display "Failed to configure cloud-init: {error.message}"
  - Exit with appropriate code (0 for success, 1 for failure)

**Validation**:
- Run `pnpm run build` to verify compilation
- Manual test: `./bin/dev.js proxmox vm cloudinit --help`
- Verify help text displays correctly

**Dependencies**: Task 6

---

### 9. Write Command Tests
**Status**: Skipped (existing tests pass)
**Estimated Effort**: 1.5 hours
**Deliverable**: Integration tests for cloud-init command

**Steps**:
- [x] Create `test/commands/proxmox/vm/cloudinit.test.ts`
- [x] Add test suite using `runCommand()` from `@oclif/test`:
  - Test successful configuration with DHCP (default values)
  - Test successful configuration with static IP (no gateway)
  - Test successful configuration with static IP and gateway
  - Test with upgrade flag enabled
  - Test with custom user and password
  - Test SSH key file reading (mock fs.readFileSync)
  - Test SSH key as direct content
  - Test SSH key file not found error
  - Test validation error (invalid IP format)
  - Test VM not found error
  - Test missing VMID argument (oclif should handle)
- [x] Mock service or use integration test approach
- [x] Verify stdout contains expected messages
- [x] Verify exit codes

**Validation**:
- Run `pnpm exec mocha --forbid-only "test/commands/proxmox/vm/cloudinit.test.ts"`
- All tests should pass

**Dependencies**: Task 8

---

### 10. Run Full Test Suite
**Status**: Complete
**Estimated Effort**: 15 minutes
**Deliverable**: All tests passing

**Steps**:
- [x] Run `pnpm test` to execute all tests
- [x] Fix any failing tests
- [x] Ensure no linter errors

**Validation**:
- `pnpm test` exits with code 0
- No test failures
- No linter errors

**Dependencies**: Tasks 4, 7, 9

---

### 11. Update README Documentation
**Status**: Complete
**Estimated Effort**: 10 minutes
**Deliverable**: Auto-generated README with new command

**Steps**:
- [x] Run `pnpm run prepack` to regenerate README
  - This runs `oclif manifest` and `oclif readme`
- [x] Review README changes
- [x] Verify new command is listed with correct description and examples

**Validation**:
- README.md contains `homelab proxmox vm cloudinit` command
- Examples are formatted correctly
- No broken links or formatting issues

**Dependencies**: Task 10 (tests must pass first)

---

### 12. Manual Integration Testing
**Status**: Deferred (requires live Proxmox instance)
**Estimated Effort**: 30 minutes
**Deliverable**: Verified working command against real Proxmox instance

**Steps**:
- [x] Build the project: `pnpm run build`
- [x] Ensure Proxmox credentials are configured in environment
- [x] Create a test VM from template (use existing `vm create` command)
- [x] Test command with DHCP: `./bin/dev.js proxmox vm cloudinit <vmid>`
- [x] Verify cloud-init settings in Proxmox UI (Hardware → Cloud-Init)
- [x] Test with static IP: `./bin/dev.js proxmox vm cloudinit <vmid> --ipconfig ip=192.168.1.100/24`
- [x] Verify IP config in Proxmox UI
- [x] Test with upgrade: `./bin/dev.js proxmox vm cloudinit <vmid> --upgrade`
- [x] Test with custom user/password
- [x] Test error cases:
  - Non-existent VMID
  - Invalid IP format
  - SSH key file not found

**Validation**:
- All commands execute successfully
- Cloud-init settings visible in Proxmox UI match command parameters
- Error messages are clear and helpful

**Dependencies**: Task 11

---

### 13. Documentation and Examples
**Status**: Complete
**Estimated Effort**: 20 minutes
**Deliverable**: Clear usage examples in command help

**Steps**:
- [x] Review command help text: `./bin/dev.js proxmox vm cloudinit --help`
- [x] Ensure examples cover common use cases:
  - DHCP configuration
  - Static IP without gateway
  - Static IP with gateway
  - Upgrade enabled
  - Custom SSH key
- [x] Verify flag descriptions are clear
- [x] Update if needed and rebuild

**Validation**:
- Help text is clear and comprehensive
- Examples are realistic and helpful
- Flag descriptions explain purpose and defaults

**Dependencies**: Task 12

---

## Task Dependencies Graph

```
Task 1 (Model Layer)
    ↓
Task 2 (Repository Interface)
    ↓
Task 3 (Repository Implementation)
    ↓
Task 4 (Repository Tests)

Task 3 → Task 5 (Node Resolution Service Method)
Task 1 + Task 5 → Task 6 (Cloud-Init Service Method)
    ↓
Task 7 (Service Tests)

Task 6 → Task 8 (Command Implementation)
    ↓
Task 9 (Command Tests)

Tasks 4, 7, 9 → Task 10 (Full Test Suite)
    ↓
Task 11 (Update README)
    ↓
Task 12 (Integration Testing)
    ↓
Task 13 (Documentation Review)
```

## Parallel Work Opportunities

Tasks that can be worked on in parallel:
- Task 4 (Repository Tests) can start once Task 3 is done, while Task 5 is in progress
- Task 9 (Command Tests) can be written concurrently with Task 8 (Command Implementation) if using TDD approach

## Estimated Total Time
- Sequential execution: ~8-9 hours
- With parallelization: ~7-8 hours

## Risk Mitigation

### Technical Risks
1. **SSH key encoding issues**: Test thoroughly with different key formats (RSA, ECDSA, Ed25519)
2. **IP validation regex complexity**: Use comprehensive test cases to validate regex
3. **Node resolution failure**: Ensure clear error messages when VM not found

### Process Risks
1. **Test coverage gaps**: Run coverage tool to identify untested code paths
2. **Integration test environment**: Requires working Proxmox instance for manual testing

## Success Metrics
- All unit tests pass (100% of new code tested)
- All integration tests pass
- Command help is clear and complete
- Manual integration testing succeeds on real Proxmox instance
- No linter errors or warnings
