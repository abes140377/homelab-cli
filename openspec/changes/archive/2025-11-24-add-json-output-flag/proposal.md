# Add JSON Output Flag

## Why

Commands currently output data exclusively in human-readable table format, which makes it difficult to use CLI output in scripts, automation pipelines, or integrate with other tools. Machine-readable JSON output is essential for programmatic consumption and enables users to pipe CLI results to tools like `jq` for filtering and processing.

## What Changes

- Leverage oclif's built-in `--json` flag (already enabled via `enableJsonFlag = true` in BaseCommand)
- Modify `proxmox vm list` command to detect JSON mode and return structured data instead of table output
- Document JSON output format in command help/examples
- Establish pattern for future commands to support JSON output

**Note**: The `--json` flag is already configured globally in BaseCommand. This change focuses on implementing the output logic in commands to support JSON mode.

## Impact

- **Affected specs**: `command-execution` (adds JSON output capability)
- **Affected code**:
  - `src/commands/proxmox/vm/list.ts` (initial implementation)
  - Future commands will follow the same pattern
- **Breaking changes**: None - this is purely additive
- **User benefit**: Enables scripting and automation use cases
