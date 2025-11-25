# Design: Add Proxmox VM Delete Command

## Architectural Context

This change extends the existing Proxmox VM management capabilities by adding deletion functionality. It follows the established layered architecture pattern used throughout the homelab-cli project.

## Key Design Decisions

### 1. Confirmation Prompt as Reusable Utility

**Decision**: Add `promptForConfirmation` to the shared prompts library rather than implementing confirmation logic directly in the command.

**Rationale**:
- **Reusability**: Other destructive commands (future delete commands for containers, templates) will need confirmation
- **Consistency**: Standardizes how confirmations work across the CLI
- **Testability**: Easier to test confirmation logic in isolation
- **Simplicity**: Boolean yes/no is a common pattern worth abstracting

**Alternatives Considered**:
- Inline confirmation in command: Would lead to code duplication
- Use `promptForSelection` with Yes/No choices: Less semantic and requires more boilerplate

**Trade-offs**:
- **Pro**: Reusable, consistent, well-tested
- **Con**: Adds another function to learn, but the simplicity justifies it

### 2. Variadic Arguments vs Flag-Based VMID Input

**Decision**: Use variadic arguments for VMIDs: `homelab proxmox vm delete 100 101 102`

**Rationale**:
- **UX Consistency**: Matches common CLI patterns (e.g., `rm file1 file2 file3`)
- **Ergonomics**: Less typing than `--vmid 100 --vmid 101 --vmid 102`
- **Readability**: Clear and intuitive what's being deleted

**Implementation**:
```typescript
static args = {
  vmids: Args.integer({
    description: 'VM IDs to delete',
    required: false, // Allow interactive mode
  }),
}
```

**Alternatives Considered**:
- Flag-based: `--vmid 100` (verbose, less ergonomic)
- CSV argument: `--vmids 100,101,102` (requires parsing, less intuitive)

### 3. Interactive Mode When No Arguments Provided

**Decision**: If no VMIDs provided, enter interactive selection mode using `promptForMultipleSelections`.

**Rationale**:
- **Discoverability**: Users don't need to remember VMIDs
- **Safety**: Seeing the VM list helps prevent mistakes
- **Efficiency**: Reduces context switching (no need to run `list` then `delete`)

**Workflow**:
1. User runs `homelab proxmox vm delete`
2. Command lists all VMs with details
3. User selects one or more VMs interactively
4. Command shows selected VMs and asks for final confirmation
5. Deletion proceeds if confirmed

**Trade-offs**:
- **Pro**: Better UX, especially for occasional users
- **Con**: Requires loading VM list (slight performance cost, acceptable given safety benefits)

### 4. Force Flag Design

**Decision**: `--force` flag skips ALL confirmations (both interactive selection confirmation and deletion confirmation).

**Rationale**:
- **Automation**: Enables scripting scenarios where prompts would block
- **Clarity**: Single flag controls all interactive behavior
- **Safety**: Force is explicit and clear in its intent

**Behavior Matrix**:

| Command | Behavior |
|---------|----------|
| `delete 100` | Shows VM details → Confirmation prompt → Delete |
| `delete 100 --force` | Immediately deletes (no prompts) |
| `delete` | Lists VMs → Multi-select → Shows selected → Confirmation → Delete |
| `delete --force` | ERROR: Force requires explicit VMIDs (prevents accidental "delete all") |

**Alternatives Considered**:
- Two flags (`--no-confirm`, `--force`): Too complex
- Force allows deletion without VMID: Too dangerous

**Safety Guardrail**: `--force` requires explicit VMIDs to prevent accidental mass deletion.

### 5. Service Layer Node Lookup

**Decision**: Service layer looks up which node a VM is on before calling repository.deleteVM.

**Rationale**:
- **Abstraction**: Commands shouldn't need to know about node topology
- **Consistency**: Matches pattern used in `createVmFromTemplate`
- **API Reality**: Proxmox API requires node for deletion endpoint

**Implementation Flow**:
```
Command: deleteVM(vmid: 100)
   ↓
Service: listVMs() → find node → repository.deleteVM(node, vmid)
   ↓
Repository: DELETE /nodes/{node}/qemu/{vmid}
```

**Alternatives Considered**:
- Make command pass node: Increases command complexity
- Add separate lookup method: Unnecessary layer

**Trade-offs**:
- **Pro**: Simple command interface, encapsulates Proxmox topology
- **Con**: Extra API call, but it's lightweight and worth the abstraction

### 6. Asynchronous Deletion with Task Waiting

**Decision**: Repository returns UPID immediately, service optionally waits for task completion.

**Rationale**:
- **API Semantics**: Proxmox DELETE returns task UPID (async operation)
- **User Feedback**: Waiting ensures user knows if deletion succeeded
- **Error Handling**: Can detect and report task failures

**Pattern** (matches existing `cloneFromTemplate`):
```typescript
// Repository: Return UPID immediately
async deleteVM(node: string, vmid: number): Promise<Result<string, RepositoryError>> {
  const result = await proxmox.nodes.$(node).qemu.$(vmid).$delete()
  return success(result) // UPID
}

// Service: Wait for completion
const deleteResult = await repository.deleteVM(node, vmid)
if (!deleteResult.success) return deleteResult

await repository.waitForTask(node, deleteResult.data) // Wait for UPID
```

**Alternatives Considered**:
- Fire and forget: Poor UX, user doesn't know if deletion succeeded
- Synchronous API: Not possible, Proxmox API is async

### 7. Error Handling Strategy

**Decision**: Three-tier error handling:
1. **Repository**: Maps API errors to RepositoryError
2. **Service**: Validates VM exists before deletion, wraps in ServiceError
3. **Command**: Displays user-friendly messages

**Error Scenarios**:

| Scenario | Repository | Service | Command Display |
|----------|-----------|---------|-----------------|
| VM not found (404) | RepositoryError | ServiceError: "VM not found" | "VM 100 not found. Use 'homelab proxmox vm list' to see available VMs" |
| Permission denied | RepositoryError | ServiceError | "Permission denied. Check your Proxmox credentials and user permissions" |
| Network error | RepositoryError | ServiceError | "Failed to connect to Proxmox. Check your network and PROXMOX_HOST configuration" |
| VM exists check fails | N/A | Check before delete | Don't attempt deletion |

**Rationale**:
- **User-Friendly**: Commands show actionable messages
- **Debuggable**: Errors include context for troubleshooting
- **Layered**: Each layer handles appropriate concerns

### 8. Multiple VM Deletion Semantics

**Decision**: Delete VMs sequentially, show progress, continue on error with summary.

**Rationale**:
- **Feedback**: Users see progress for long-running operations
- **Resilience**: One failure doesn't block others
- **Transparency**: Summary shows what succeeded and failed

**Output Example**:
```
Deleting 3 VMs...

[1/3] Deleting VM 100 'web-server' on node 'pve1'... ✓ Done
[2/3] Deleting VM 101 'db-server' on node 'pve2'... ✓ Done
[3/3] Deleting VM 102 'cache-server' on node 'pve1'... ✗ Failed: VM not found

Summary:
  Successful: 2
  Failed: 1
```

**Alternatives Considered**:
- Parallel deletion: Complex error handling, unclear progress
- Stop on first error: Poor UX for batch operations

### 9. JSON Output Mode

**Decision**: Support `--json` flag (inherited from BaseCommand) with structured output.

**Rationale**:
- **Automation**: Enables programmatic parsing
- **Consistency**: All commands support JSON
- **Completeness**: Includes all relevant data

**Output Schema**:
```typescript
// Single VM success
{
  "vmid": 100,
  "name": "web-server",
  "node": "pve1",
  "status": "deleted"
}

// Multiple VMs
{
  "deleted": [
    {"vmid": 100, "name": "web-server", "node": "pve1"},
    {"vmid": 101, "name": "db-server", "node": "pve2"}
  ],
  "failed": [
    {"vmid": 102, "error": "VM not found"}
  ]
}

// Error
{
  "error": "VM 100 not found"
}
```

**JSON Mode Behavior**:
- Disables all prompts (requires `--force` or errors)
- Suppresses progress messages
- Outputs only valid JSON
- Exit code 0 for success, 1 for errors

### 10. VM Details Display Before Confirmation

**Decision**: Show VM details (VMID, Name, Node, Status) in a table before confirmation prompt.

**Rationale**:
- **Transparency**: User sees exactly what they're deleting
- **Mistake Prevention**: Helps catch wrong VMID errors
- **Consistency**: Matches existing table format from `vm list`

**Example Output**:
```
The following VMs will be deleted:

┌──────┬─────────────┬──────┬─────────┐
│ VMID │ Name        │ Node │ Status  │
├──────┼─────────────┼──────┼─────────┤
│ 100  │ web-server  │ pve1 │ running │
│ 101  │ db-server   │ pve2 │ stopped │
└──────┴─────────────┴──────┴─────────┘

⚠️  WARNING: This action cannot be undone. All VM data will be permanently deleted.

Are you sure you want to delete these VMs? (yes/no)
```

## Cross-Cutting Concerns

### Security
- No sensitive data in error messages
- Force flag explicit to prevent accidental automation
- Confirmation required by default

### Testing
- Unit tests for each layer with mocks
- Integration tests for command with service mocks
- Manual testing with real Proxmox environment

### Performance
- Node lookup adds one extra API call (acceptable)
- Sequential deletion may be slow for many VMs (acceptable given safety priority)

### Maintainability
- Follows existing patterns (cloneFromTemplate, setVMConfig)
- Confirmation prompt reusable for future commands
- Clear separation of concerns across layers

## Future Considerations

### Potential Enhancements (Out of Scope for This Change)

1. **Pre-deletion Backup**: Optionally create backup before deletion
2. **Dry Run Mode**: `--dry-run` to preview without deleting
3. **Purge vs Delete**: Different deletion modes (keep volumes vs remove all)
4. **Batch File Input**: Delete VMs from file (e.g., `--from-file vms.txt`)
5. **Filter-Based Deletion**: Delete by tag, name pattern, etc.

These are intentionally excluded to keep the change focused and deliverable.

## Validation Strategy

### Automated Testing
- Repository: Mock Proxmox API responses
- Service: Mock repository
- Command: Mock service and test user interactions

### Manual Testing
- Real Proxmox environment testing:
  - Create test VMs
  - Test single deletion
  - Test multiple deletion
  - Test force flag
  - Test interactive mode
  - Test error scenarios

### Edge Cases
- VM deleted externally during confirmation wait
- Network failure mid-deletion
- Concurrent deletions
- Invalid VMIDs mixed with valid ones

## Success Metrics

- [ ] All automated tests pass
- [ ] Manual testing covers all scenarios
- [ ] `openspec validate` passes with `--strict`
- [ ] No regressions in existing commands
- [ ] User-friendly error messages for all failure modes
- [ ] Documentation complete and accurate
