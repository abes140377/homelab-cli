# Tasks: Add Proxmox Container List Command

## Implementation Checklist

- [x] **Create command file structure**
  - Create directory `src/commands/proxmox/container/`
  - Create file `src/commands/proxmox/container/list.ts`
  - Verify: Directory structure matches oclif conventions

- [x] **Implement ProxmoxContainerList command class**
  - Extend `BaseCommand<typeof ProxmoxContainerList>`
  - Add static `description` property: "List all Proxmox LXC containers"
  - Add static `examples` array with sample command and table output
  - Implement `async run(): Promise<void>` method
  - Verify: Class structure matches existing `ProxmoxVMList` command pattern

- [x] **Implement command run() logic**
  - Call `await this.parse(ProxmoxContainerList)` to parse arguments
  - Use `ProxmoxVMFactory.createProxmoxVMService()` to get service instance
  - Call `await service.listVMs('lxc')` to retrieve LXC containers
  - Handle failure case: call `this.error()` with message "Failed to list containers: {error.message}"
  - Handle empty case: output "No containers found" and return early
  - Verify: Result pattern handling is correct (check `result.success` before accessing `result.data`)

- [x] **Implement table output formatting**
  - Create `cli-table3` table with headers: VMID, Name, Status, IPv4 Address
  - Iterate through containers and add rows with: vmid, name, status, ipv4Address ?? 'N/A'
  - Output table using `this.log(table.toString())`
  - Verify: Table format matches `ProxmoxVMList` command output exactly

- [x] **Create command test file structure**
  - Create directory `test/commands/proxmox/container/`
  - Create file `test/commands/proxmox/container/list.test.ts`
  - Verify: Test directory mirrors source directory structure

- [x] **Implement successful listing test**
  - Use `runCommand` from `@oclif/test` to execute command
  - Mock or use real service (consider using integration test approach)
  - Assert stdout contains table headers: VMID, Name, Status, IPv4 Address
  - Assert stdout contains expected container data (if using fixtures)
  - Verify: Test follows existing command test patterns in `test/commands/proxmox/vm/list.test.ts`

- [x] **Implement empty list test**
  - Mock service to return empty array
  - Execute command via `runCommand`
  - Assert stdout contains "No containers found"
  - Assert stdout does NOT contain table structure
  - Verify: Empty state handling matches requirement

- [x] **Implement error handling test**
  - Mock service to return failure Result with specific error
  - Execute command via `runCommand` and expect it to throw
  - Verify error message matches "Failed to list containers: {error.message}"
  - Verify: Error handling follows Result pattern correctly

- [x] **Build and compile**
  - Run `pnpm run build` to compile TypeScript
  - Verify: No compilation errors
  - Verify: Command appears in `dist/commands/proxmox/container/list.js`

- [x] **Run all tests**
  - Run `pnpm test` to execute all tests including new ones
  - Verify: All tests pass, including new container list tests
  - Verify: No existing tests are broken
  - Verify: Linting passes (runs automatically after tests)

- [x] **Manual testing**
  - Execute `./bin/dev.js proxmox container list` with real Proxmox credentials
  - Verify: Command lists LXC containers correctly
  - Verify: Table format matches expected output
  - Verify: IPv4 addresses are fetched from guest agent (or show "N/A")
  - Verify: Empty case shows "No containers found" when no containers exist
  - Verify: Error cases display appropriate error messages

- [x] **Update README (if needed)**
  - Run `pnpm run prepack` to regenerate README with new command
  - Verify: New command appears in README commands section
  - Verify: oclif manifest is regenerated

## Validation Steps

- [x] Run `openspec validate add-proxmox-container-list-command --strict`
- [x] Verify all spec requirements are testable
- [x] Verify command follows layered architecture pattern
- [x] Verify no breaking changes to existing functionality
- [x] Verify command is discoverable via `homelab proxmox container --help`

## Dependencies

- Depends on existing `ProxmoxVMService.listVMs('lxc')` implementation
- Depends on existing `ProxmoxVMFactory` for dependency injection
- Depends on existing `BaseCommand` class
- No new npm packages required

## Notes

- This change only adds a new command - no modifications to service or repository layers needed
- The infrastructure for listing LXC containers already exists (via `listResources('lxc')`)
- Command pattern exactly mirrors `proxmox vm list` for consistency
- Tests should follow the same pattern as VM list tests for maintainability
