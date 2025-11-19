# Enhance Debug Logging

## Overview
Enhance the existing `--log-level` flag functionality by adding comprehensive debug logging throughout repository methods. When the debug log level is active, all repository errors should output detailed error information including stack traces, error causes, and full context to aid in troubleshooting.

## Motivation
Currently, when repository methods fail, error messages provide basic information but lack the detailed context needed for effective debugging. Developers and operators need visibility into:
- Full error stack traces
- Underlying error causes (nested errors)
- Complete error context (parameters, state)
- Error propagation chain

This is especially important for Proxmox API interactions where network issues, authentication problems, or API errors can be difficult to diagnose without detailed logging.

## Goals
- Leverage the existing `--log-level debug` flag for enhanced error output
- Add detailed error logging to all repository methods
- Include stack traces, error causes, and full context in debug output
- Maintain clean, user-friendly error messages at default log levels
- Provide a systematic pattern for debug logging across all repositories

## Non-Goals
- Adding a new debug flag (the `--log-level` flag already exists)
- Changing the error handling pattern (Result types remain unchanged)
- Modifying service or command layer error handling
- Adding structured logging frameworks

## Scope
This change affects:
- All repository classes (`ProxmoxApiRepository`, `ProjectFsRepository`, `ModuleFsRepository`)
- Error handling in repository methods
- Debug output formatting

This change does NOT affect:
- Service layer
- Command layer
- Error classes themselves
- The Result pattern

## Implementation Strategy
1. **Proof of Concept**: Implement enhanced debug logging in one Proxmox repository method
2. **Validation**: Trigger an error with `--log-level debug` and verify stack trace output
3. **Rollout**: Apply the same pattern to all repository methods across all repositories

## Success Criteria
- When `--log-level debug` is set and a repository error occurs, the console output includes:
  - Full error stack trace
  - Error cause chain (if present)
  - Complete error context (parameters, state)
- Normal log levels (info, warn, error) show concise, user-friendly messages
- All repository methods follow consistent debug logging pattern

## Dependencies
- None (uses existing oclif `--log-level` flag infrastructure)

## Risks and Mitigations
- **Risk**: Debug output may expose sensitive information (passwords, tokens)
  - **Mitigation**: Review context objects to ensure sensitive data is not logged
- **Risk**: Excessive debug output may make logs difficult to read
  - **Mitigation**: Only activate on explicit `--log-level debug` flag usage
- **Risk**: Performance impact from formatting debug output
  - **Mitigation**: Debug logging only happens in error paths (rare occurrence)
