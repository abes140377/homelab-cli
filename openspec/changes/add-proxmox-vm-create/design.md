# Design: Proxmox VM Creation

## Architectural Overview

This change extends the existing Proxmox VM management layer with clone/create capabilities. It follows the established layered architecture pattern used throughout the codebase:

```
Command Layer (proxmox/vm/create.ts)
    ↓
Service Layer (proxmox-vm.service.ts)
    ↓
Repository Layer (proxmox-api.repository.ts)
    ↓
proxmox-api npm package
    ↓
Proxmox VE API
```

## Key Design Decisions

### 1. Use Template Name Instead of VMID

**Decision**: Accept template name as a CLI argument, not template VMID

**Rationale**:
- Template names are more user-friendly and memorable than numeric IDs
- Consistent with user expectation (users think in terms of "ubuntu-22.04" not "VMID 100")
- Reduces cognitive load - users don't need to run `template list` before every create

**Implementation**:
- Service layer will resolve template name to VMID by querying existing `listTemplates()` method
- First match wins (document this behavior)
- Clear error if template not found

### 2. Automatic VMID Allocation

**Decision**: Automatically allocate the next available VMID instead of requiring user input

**Rationale**:
- Reduces user error (VMID conflicts, invalid ranges)
- Simplifies command interface
- Matches user expectation from other VM platforms (e.g., VirtualBox, Docker)

**Implementation**:
- Repository method to find next available VMID
- Query existing VMs and templates to find gaps
- Use Proxmox convention: start from 100, increment by 1
- Handle race conditions with API error retry

### 3. Full Clone Only (Not Linked Clone)

**Decision**: Only support full clones in this initial implementation

**Rationale**:
- Full clones are independent and safer for production use
- Simpler implementation (no dependency management on template)
- Linked clones require additional complexity (storage pools, template lifecycle)
- Full clones align with homelab use case (template modifications)

**Future**: Can add `--linked` flag later if needed

### 4. Synchronous Operation with Task Polling

**Decision**: Poll Proxmox task API until clone completes before returning to user

**Rationale**:
- Provides clear success/failure feedback immediately
- Avoids confusion about whether operation completed
- CLI pattern matches user expectation (command completes when work is done)

**Implementation**:
- Repository method `cloneFromTemplate` returns task UPID
- Repository method `waitForTask(upid)` polls until completion
- Service layer orchestrates: clone → wait → return result
- Timeout after 5 minutes with clear error message

### 5. Use Existing ProxmoxVMDTO (No New DTO)

**Decision**: Reuse existing ProxmoxVMDTO for create operation response

**Rationale**:
- Clone API returns the same data structure as VM listing
- Maintains consistency across codebase
- Reduces model proliferation
- Type safety through existing Zod schema

## API Interactions

### Proxmox API Endpoints Used

1. **Clone VM from Template**
   - Endpoint: `POST /nodes/{node}/qemu/{vmid}/clone`
   - Parameters:
     - `newid`: Allocated VMID for new VM
     - `name`: User-provided VM name
     - `full`: `1` (full clone)
   - Returns: Task UPID

2. **Task Status Polling**
   - Endpoint: `GET /nodes/{node}/tasks/{upid}/status`
   - Returns: Task status (`running`, `stopped`) and exit status

3. **Find Template by Name** (existing)
   - Uses existing `listTemplates()` repository method
   - Filters by name match

4. **Find Next Available VMID**
   - Endpoint: `GET /cluster/resources?type=vm`
   - Parse all VMIDs, find first gap >= 100

### proxmox-api Package Usage

Based on the package README, API calls follow this pattern:

```typescript
// Clone: POST /nodes/{node}/qemu/{vmid}/clone
const cloneTask = await proxmox.nodes.$(node).qemu.$(templateVmid).clone.$post({
  newid: newVmid,
  name: vmName,
  full: 1,
});

// Task status: GET /nodes/{node}/tasks/{upid}/status
const taskStatus = await proxmox.nodes.$(node).tasks.$(upid).status.$get();
```

## Repository Interface Changes

### New Methods on IProxmoxRepository

```typescript
interface IProxmoxRepository {
  // Existing methods
  listResources(resourceType: 'qemu' | 'lxc'): Promise<Result<ProxmoxVMDTO[], RepositoryError>>;
  listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>>;

  // New methods
  /**
   * Finds the next available VMID in the Proxmox cluster.
   * @returns Result containing next available VMID or error
   */
  getNextAvailableVmid(): Promise<Result<number, RepositoryError>>;

  /**
   * Clones a VM template to create a new VM.
   * @param node Node where template resides
   * @param templateVmid VMID of the template to clone
   * @param newVmid VMID for the new VM
   * @param vmName Name for the new VM
   * @returns Result containing task UPID or error
   */
  cloneFromTemplate(
    node: string,
    templateVmid: number,
    newVmid: number,
    vmName: string,
  ): Promise<Result<string, RepositoryError>>;

  /**
   * Waits for a Proxmox task to complete.
   * @param node Node where task is running
   * @param upid Task UPID
   * @param timeoutMs Timeout in milliseconds (default 300000 = 5 minutes)
   * @returns Result indicating success or error
   */
  waitForTask(
    node: string,
    upid: string,
    timeoutMs?: number,
  ): Promise<Result<void, RepositoryError>>;
}
```

## Service Layer Design

### ProxmoxVMService New Method

```typescript
class ProxmoxVMService {
  /**
   * Creates a new VM from a template by name.
   *
   * Process:
   * 1. Resolve template name to template DTO (vmid, node)
   * 2. Allocate next available VMID
   * 3. Clone template to new VMID
   * 4. Wait for clone task to complete
   * 5. Return success with new VM details
   *
   * @param vmName Name for the new VM
   * @param templateName Name of the template to clone from
   * @returns Result containing new VM details or error
   */
  async createVmFromTemplate(
    vmName: string,
    templateName: string,
  ): Promise<Result<{vmid: number; name: string; node: string}, ServiceError>>
}
```

## Command Layer Design

### Command: proxmox vm create

**Location**: `src/commands/proxmox/vm/create.ts`

**Class**: `ProxmoxVmCreate`

**Arguments**:
- `vm-name`: String, required - Name for the new VM
- `template-name`: String, required - Name of the template to clone

**Flags**: None (initially - can add later for advanced options)

**Output**:
- Success: "Successfully created VM {vmid} '{name}' on node '{node}'"
- Error: "Failed to create VM: {error message}"

**Example**:
```bash
$ homelab proxmox vm create my-server ubuntu-22.04
Creating VM 'my-server' from template 'ubuntu-22.04'...
Successfully created VM 200 'my-server' on node 'pve'
```

## Error Handling Strategy

### Repository Layer Errors
- API connection failures → RepositoryError with network context
- Template not found (404) → RepositoryError "Template not found"
- VMID conflict (400/500) → RepositoryError "VMID already in use"
- Task timeout → RepositoryError "Clone operation timed out"
- Task failure → RepositoryError with task exit status

### Service Layer Errors
- Template name resolution fails → ServiceError "Template '{name}' not found"
- No available VMIDs → ServiceError "No available VMIDs in range 100-999999"
- Repository errors → Wrap in ServiceError with context

### Command Layer
- Service errors → Display via `this.error()` with exit code 1
- Success → Display success message with VMID, name, node

## Data Flow Example

**User Input**: `homelab proxmox vm create my-server ubuntu-22.04`

1. **Command parses args**:
   - `vmName = "my-server"`
   - `templateName = "ubuntu-22.04"`

2. **Command calls service**:
   ```typescript
   const result = await service.createVmFromTemplate("my-server", "ubuntu-22.04")
   ```

3. **Service orchestrates**:
   a. `const templates = await repository.listTemplates()`
   b. `const template = templates.find(t => t.name === "ubuntu-22.04")` → vmid: 100, node: "pve"
   c. `const newVmid = await repository.getNextAvailableVmid()` → 200
   d. `const upid = await repository.cloneFromTemplate("pve", 100, 200, "my-server")` → "UPID:pve:..."
   e. `await repository.waitForTask("pve", "UPID:pve:...")` → success
   f. Return `{vmid: 200, name: "my-server", node: "pve"}`

4. **Command displays**: "Successfully created VM 200 'my-server' on node 'pve'"

## Testing Strategy

### Unit Tests

**Repository Tests** (`test/repositories/proxmox-api.repository.test.ts`):
- Mock proxmox-api responses
- Test `getNextAvailableVmid()` with various VMID distributions
- Test `cloneFromTemplate()` success and error cases
- Test `waitForTask()` completion, timeout, and failure scenarios

**Service Tests** (`test/services/proxmox-vm.service.test.ts`):
- Mock repository with interface
- Test `createVmFromTemplate()` happy path
- Test template not found error
- Test VMID allocation failure
- Test clone API failure
- Test task timeout

**Command Tests** (`test/commands/proxmox/vm/create.test.ts`):
- Use `runCommand()` from `@oclif/test`
- Test successful VM creation output
- Test template not found error message
- Test service error handling

### Integration Tests

**Manual Testing Checklist**:
- [ ] Create VM from existing template
- [ ] Verify VM appears in `homelab proxmox vm list`
- [ ] Test with non-existent template name
- [ ] Test when all VMIDs are allocated (simulate)
- [ ] Test with Proxmox API unavailable

## Future Enhancements (Out of Scope)

These are explicitly deferred to future proposals:

1. **Custom VM Configuration**
   - Flags for CPU, memory, disk size during creation
   - Flag for network configuration

2. **Linked Clones**
   - `--linked` flag for space-efficient clones

3. **Batch Creation**
   - Create multiple VMs from same template

4. **VM Start**
   - `--start` flag to start VM after creation
   - Separate `homelab proxmox vm start` command

5. **Node Selection**
   - `--node` flag to specify target node
   - Currently uses template's node

6. **Storage Pool Selection**
   - `--storage` flag for target storage
   - Currently uses template's storage

## Migration Impact

No migration needed - this is a purely additive change. Existing commands and functionality remain unchanged.

## Backwards Compatibility

Fully backwards compatible:
- No changes to existing repository methods
- No changes to existing service methods
- No changes to existing commands
- Only adds new methods/command

## Performance Considerations

**Clone Operation Duration**:
- Full clone of typical template (20GB disk): 30-120 seconds depending on storage
- Command will appear to "hang" during this time
- Mitigation: Display "Creating..." message immediately

**VMID Allocation**:
- Queries all cluster resources once
- O(n) where n = number of VMs/templates
- Acceptable for homelab scale (< 1000 VMs)

**API Call Frequency**:
- Total API calls per create operation: 3-4
  - List templates (1 call)
  - Get cluster resources for VMID (1 call)
  - Clone template (1 call)
  - Poll task status (1-10+ calls depending on duration)
- Acceptable for interactive CLI usage
