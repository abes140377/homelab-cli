# Design: Proxmox VM Stop Command

## Architecture Overview

This change follows the established layered architecture pattern used throughout the homelab-cli project. The implementation mirrors the VM start command structure for consistency and maintainability.

### Layer Responsibilities

```
┌─────────────────────────────────────────────────────────────┐
│ Command Layer (src/commands/proxmox/vm/stop.ts)            │
│ - Parse variadic VMID arguments                            │
│ - Provide interactive selection for running VMs            │
│ - Display progress and results                             │
│ - Handle JSON output mode                                  │
│ - Convert Result types to oclif errors                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Service Layer (src/services/proxmox-vm.service.ts)         │
│ - Find VM node from cluster listing                        │
│ - Call repository stopVM method                            │
│ - Wrap repository errors in ServiceError                   │
│ - Return Result<{vmid, name, node}, ServiceError>          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Repository Layer (src/repositories/proxmox-api.repository) │
│ - POST to /nodes/{node}/qemu/{vmid}/status/stop            │
│ - Return task UPID on success                              │
│ - Wrap API errors in RepositoryError                       │
│ - Return Result<string, RepositoryError>                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  Proxmox API (HTTPS)
```

## API Integration

### Proxmox Stop VM Endpoint

**Endpoint**: `POST /api2/json/nodes/{node}/qemu/{vmid}/status/stop`

**Request Parameters**:
- None required for basic graceful shutdown
- Optional: `timeout` (seconds to wait before force stop)
- Optional: `keepActive` (do not deactivate storage)

**Response**:
```json
{
  "data": "UPID:pve:00001234:00ABCDEF:65432101:qmshutdown:100:root@pam:"
}
```

**Implementation Choice**: Use graceful shutdown without timeout parameter to ensure safe VM shutdown. This matches user expectations for a "stop" operation.

## Command Design

### Variadic Arguments Pattern

Following the VM start and delete commands, the stop command accepts multiple VMIDs:

```bash
homelab proxmox vm stop 100          # Single VM
homelab proxmox vm stop 100 101 102  # Multiple VMs
homelab proxmox vm stop              # Interactive mode
```

### Interactive Mode Filtering

**Key Difference from Start Command**: Filter for running VMs instead of stopped VMs.

```typescript
const runningVms = vms.filter((vm) => vm.status === 'running')
```

Use `promptForMultipleSelections` to allow selecting multiple VMs to stop.

### Progress Display

For multiple VMs, show sequential progress:
```
[1/3] Stopping VM 100 'web-server' on node 'pve1'...
[2/3] Stopping VM 101 'db-server' on node 'pve1'...
[3/3] Stopping VM 102 'cache-server' on node 'pve2'...

Stop Summary:
  Successful: 3
  Failed: 0
```

## Error Handling Strategy

### VM Not Found
```
Error: VM 100 not found. Use 'homelab proxmox vm list' to see available VMs.
```

### VM Already Stopped
The Proxmox API typically accepts stop requests for already-stopped VMs as a no-op. The service layer should:
1. Check VM status before calling stopVM
2. Return success with a note if already stopped
3. Avoid unnecessary API calls

### Partial Failures
When stopping multiple VMs, continue attempting all stops even if some fail:
```typescript
const stopped: Array<{vmid, name, node}> = []
const failed: Array<{vmid, error}> = []

for (const vm of vmsToStop) {
  const result = await service.stopVM(vm.vmid)
  if (result.success) {
    stopped.push(result.data)
  } else {
    failed.push({vmid: vm.vmid, error: result.error.message})
  }
}
```

## JSON Output Format

### Single VM Success
```json
{
  "vmid": 100,
  "name": "web-server",
  "node": "pve1",
  "status": "stopped"
}
```

### Multiple VMs
```json
{
  "stopped": [
    {"vmid": 100, "name": "web-server", "node": "pve1"},
    {"vmid": 101, "name": "db-server", "node": "pve1"}
  ],
  "failed": [
    {"vmid": 102, "error": "VM is locked by another operation"}
  ]
}
```

## Sequential vs Parallel Execution

**Decision**: Execute stops sequentially (not in parallel)

**Rationale**:
1. Matches VM start command pattern
2. Prevents overwhelming Proxmox API with concurrent requests
3. Provides clear progress feedback per VM
4. Makes error attribution easier
5. Graceful shutdown may take time; parallel requests could timeout

**Implementation**: Use `await` in loop with ESLint disable comment:
```typescript
/* eslint-disable no-await-in-loop */
for (const vm of vmsToStop) {
  const result = await service.stopVM(vm.vmid)
  // handle result
}
/* eslint-enable no-await-in-loop */
```

## Testing Strategy

### Repository Layer Tests
- Mock Proxmox API client
- Verify correct endpoint construction: `/nodes/{node}/qemu/{vmid}/status/stop`
- Test successful API response → Result<string, RepositoryError>
- Test API error → RepositoryError wrapping
- Test network failures

### Service Layer Tests
- Mock repository with success/failure scenarios
- Test VM node resolution from listResources
- Test error wrapping (RepositoryError → ServiceError)
- Test Result type handling
- Test VM not found scenario

### Command Layer Tests
- Use `@oclif/test` `runCommand` helper
- Test single VM stop output
- Test multiple VM stop with summary
- Test interactive mode (mock prompt responses)
- Test JSON output format
- Test error messages and exit codes
- Test variadic argument parsing

## Consistency with Existing Commands

### Similarities to VM Start Command
- Variadic VMID arguments with `static strict = false`
- Interactive mode with filtered VM list
- Sequential execution with progress display
- JSON output mode support
- Same error message patterns
- Same service method signature pattern

### Differences
- Filter for `status === 'running'` instead of `status === 'stopped'`
- API endpoint: `/status/stop` instead of `/status/start`
- No special handling for already-stopped VMs (unlike start checking for already-running)

## File Locations

Following oclif conventions:

```
src/commands/proxmox/vm/stop.ts              # Command implementation
src/services/proxmox-vm.service.ts           # Add stopVM method
src/repositories/proxmox-api.repository.ts   # Add stopVM method
src/repositories/interfaces/proxmox.repository.interface.ts  # Add interface method
test/commands/proxmox/vm/stop.test.ts        # Command tests
test/services/proxmox-vm.service.test.ts     # Update with stopVM tests
test/repositories/proxmox-api.repository.test.ts  # Update with stopVM tests
```

## Implementation Phases

### Phase 1: Repository Layer
1. Add `stopVM` method to `IProxmoxRepository` interface
2. Implement `stopVM` in `ProxmoxApiRepository`
3. Add repository tests

### Phase 2: Service Layer
1. Add `stopVM` method to `ProxmoxVMService`
2. Implement VM node resolution logic
3. Add service tests

### Phase 3: Command Layer
1. Create `src/commands/proxmox/vm/stop.ts`
2. Implement argument parsing and interactive mode
3. Add progress display and summary
4. Implement JSON output mode
5. Add command tests

### Phase 4: Integration Testing
1. Test against real Proxmox cluster (optional)
2. Verify end-to-end flow
3. Update README with `oclif readme`

## Alternative Approaches Considered

### Force Shutdown Option
**Rejected**: Graceful shutdown is safer and matches user expectations. Force shutdown could be added later as a separate flag if needed, but shouldn't be the default behavior.

### Parallel Execution
**Rejected**: See "Sequential vs Parallel Execution" section above.

### Combined Start/Stop Command with Flag
**Rejected**: Separate commands provide clearer semantics and better discoverability. Matches industry conventions (systemctl start/stop, docker start/stop, etc.).

## Security Considerations

1. **API Token Permissions**: Requires VM.PowerMgmt permission in Proxmox
2. **Input Validation**: VMIDs validated as integers, filtered for NaN values
3. **No Sensitive Data in Logs**: Debug logging excludes API tokens (existing pattern)
4. **Interactive Confirmation**: Not required for stop (less destructive than delete)

## Performance Considerations

1. **Sequential Execution**: Adds latency for multiple VMs but ensures API stability
2. **VM Listing**: Reuses existing `listResources('qemu')` call
3. **No Task Waiting**: Command returns after initiating stop, doesn't wait for completion (matches start command behavior)

## Documentation Updates

1. Add command examples to static `examples` property
2. Add help text via static `description` property
3. README auto-generated via `oclif readme` during `prepack`
4. Include in main command list

## Success Metrics

- Command successfully stops running VMs
- Interactive mode shows only running VMs
- Error messages guide users to resolution
- JSON output supports scripting use cases
- Tests achieve >90% coverage
- Code review feedback addressed
- User feedback positive (if applicable)
