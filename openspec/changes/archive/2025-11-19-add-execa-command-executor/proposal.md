# Proposal: Integrate execa for Command Execution

## Why

The project currently uses Node's native `child_process.spawn` for executing external commands (vscode, zellij). This requires manual error handling, Promise wrapping, and platform-specific considerations. The `execa` npm package provides a modern, Promise-based API with better error handling, cleaner syntax, and cross-platform reliability. Integrating execa will standardize command execution across the CLI and reduce boilerplate code.

## What Changes

- Add `execa` as a dependency to package.json
- Create a new `CommandExecutorService` at `src/services/command-executor.service.ts` that wraps execa with the project's Result pattern
- Implement event-based streaming for real-time output display
- Support command execution with configurable options (working directory, environment variables, timeout)
- Create standardized output formatting for command execution results
- Add a new `homelab exec demo` command that demonstrates various execution scenarios with consistent output formatting
- Add comprehensive tests for the service and command
- Document the new capability in OpenSpec

**Existing commands will NOT be modified in this change** - they will continue using `spawn`. Migration to the new service will be handled in a future change.

## Impact

### Affected Specs
- **NEW**: `command-execution` - New capability for executing shell commands
- **NEW**: `exec-demo-command` - Demo command showcasing command execution patterns

### Affected Code
- `package.json` - Add execa dependency
- `src/services/` - New CommandExecutorService
- `src/commands/exec/` - New exec demo command
- `test/services/` - Service tests
- `test/commands/exec/` - Command tests

### Dependencies
- Introduces `execa` (ESM package, latest version compatible with Node >= 18)
- No breaking changes to existing code
