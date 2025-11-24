# Implementation Tasks

## 1. Update proxmox vm list Command
- [x] 1.1 Modify `src/commands/proxmox/vm/list.ts` to detect JSON mode using `this.jsonEnabled()`
- [x] 1.2 Add conditional logic: return data array when JSON mode is enabled, otherwise output table
- [x] 1.3 Handle empty results appropriately in both modes (empty array vs. message)
- [x] 1.4 Update command examples to include `--json` flag usage with sample output

## 2. Testing
- [x] 2.1 Write unit test for `proxmox vm list` with `--json` flag
- [x] 2.2 Write unit test for `proxmox vm list` without `--json` flag (existing behavior)
- [x] 2.3 Write test for empty results with `--json` flag
- [x] 2.4 Write test for empty results without `--json` flag
- [x] 2.5 Verify JSON output is valid and parseable with `JSON.parse()`
- [x] 2.6 Run all tests with `pnpm test` to ensure no regressions

## 3. Documentation
- [x] 3.1 Add JSON output example to command's static examples array
- [x] 3.2 Document the JSON output schema in the command description or examples
- [x] 3.3 Ensure `pnpm run prepack` generates updated README with new examples

## 4. Manual Testing
- [x] 4.1 Build the project with `pnpm run build`
- [x] 4.2 Test `./bin/dev.js proxmox vm list` (table output)
- [x] 4.3 Test `./bin/dev.js proxmox vm list --json` (JSON output)
- [x] 4.4 Test `./bin/dev.js proxmox vm list --json | jq` (verify parseable)
- [x] 4.5 Test with empty results in both modes
- [x] 4.6 Verify help output with `./bin/dev.js proxmox vm list --help`

## 5. Code Quality
- [x] 5.1 Run linter with `pnpm run lint` and fix any issues
- [x] 5.2 Ensure TypeScript compiles without errors
- [x] 5.3 Verify no `--forbid-only` test violations
