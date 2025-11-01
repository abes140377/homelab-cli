# Proposal: Refactor Workspace VSCode Command

## Metadata
- **Change ID**: `refactor-workspace-vscode-command`
- **Status**: Draft
- **Type**: Refactoring
- **Author**: User Request
- **Created**: 2025-11-01

## Why

The current `workspace start` command has dual responsibility: launching workspaces in VSCode OR terminal. This creates complexity in the command interface and violates the single responsibility principle. The command signature `homelab workspace start <workspace-name> --vscode|--terminal` requires mutually exclusive flags, making the interface less intuitive.

Additionally:
- The command tries to do two different things (VSCode vs terminal) with a flag toggle
- Terminal support will be moved to a separate command later
- The current command structure doesn't follow a clear resource-action pattern

Refactoring to a simpler, single-purpose command will improve usability, maintainability, and follow better CLI design patterns.

## What Changes

- **BREAKING**: Replace `homelab workspace start <workspace-name> --vscode` with `homelab workspace vscode <workspace-name> <context-name>`
- **BREAKING**: Remove `--terminal` flag and terminal launch functionality
- **BREAKING**: Remove `--vscode` flag (command path now indicates VSCode launch)
- **BREAKING**: Remove `--context` flag; context is now required positional argument
- **BREAKING**: Remove auto-selection of single context; context must be explicitly specified
- Delete `src/commands/workspace/start.ts` command file
- Create new `src/commands/workspace/vscode.ts` command file
- Update command argument structure to use two required positional arguments
- Remove mutual exclusivity flag validation logic
- Keep workspace/context validation using PocketBase
- Keep WorkspaceLauncherService.launchVSCode() integration unchanged
- Update tests to reflect new command structure
- Update README with new command documentation

**Command Transformation**:
- **Before**: `homelab workspace start <workspace-name> --vscode [--context <name>]`
- **After**: `homelab workspace vscode <workspace-name> <context-name>`

**Benefits**:
- Clearer intent - command name indicates action
- Simpler interface - no flag toggles
- Single responsibility - only launches VSCode
- Better extensibility - easy to add `workspace terminal` later
- More intuitive CLI pattern

## Impact

**Affected specs:**
- `workspace-start` (will be replaced by new `workspace-vscode` spec)

**Affected code:**
- `src/commands/workspace/start.ts` (deleted)
- `src/commands/workspace/vscode.ts` (new file)
- `test/commands/workspace/start.test.ts` (deleted)
- `test/commands/workspace/vscode.test.ts` (new file)
- `README.md` (auto-generated, will reflect new command)

**Unaffected code:**
- `src/services/workspace-launcher.service.ts` (no changes)
- `src/services/workspace.service.ts` (no changes)
- `src/repositories/workspace.repository.ts` (no changes)
- `src/models/` (no changes)
- `src/factories/` (no changes)

## Scope

### In Scope
- Refactor command file structure and location
- Update command signature to use positional arguments
- Remove terminal-related code and flags
- Update command tests to reflect new structure
- Create workspace-vscode spec with new requirements

### Out of Scope
- Terminal command implementation (future work)
- Changes to WorkspaceLauncherService (keep as-is, only use VSCode method)
- Changes to repository layer (no changes needed)
- Changes to workspace/context domain models

## Breaking Changes and Migration

### Breaking Changes
- **Command Signature**: Existing users using `homelab workspace start <name> --vscode` will need to migrate to `homelab workspace <name> vscode <context>`
- **Terminal Support**: Users relying on `--terminal` flag will lose this functionality until new command is implemented

### Migration Path
Users currently using:
```bash
homelab workspace start myproject --vscode --context backend
```

Will need to use:
```bash
homelab workspace myproject vscode backend
```

### Dependencies
- No changes to services, repositories, or models
- WorkspaceLauncherService.launchVSCode() method remains unchanged
- Workspace validation logic remains the same

## Alternatives Considered

### Alternative 1: Keep current structure, remove terminal
- Keep `workspace start <name>` with `--vscode` flag
- Remove `--terminal` flag only
- **Rejected**: Still requires flag for what should be implicit from command name

### Alternative 2: Use subcommand pattern
- Use `workspace start vscode <name> <context>`
- **Rejected**: Less intuitive than resource-first pattern

### Alternative 3: Keep auto-context selection
- Make context optional, auto-select if single context
- **Rejected**: Adds complexity and implicit behavior; explicit is better

## Open Questions

1. **Dynamic Command Pattern**: oclif supports dynamic arguments in command paths, but should we verify this pattern works as expected?
   - **Decision needed**: Test if `workspace/[workspace-name]/vscode.ts` is supported or if we need a different approach

2. **Context Validation**: Should we still validate that the context exists in PocketBase before launching?
   - **Recommended**: Yes, keep validation to provide helpful error messages
   - **Alternative**: Skip validation and let VSCode fail if file doesn't exist

3. **Workspace File Existence**: Should we validate the `.code-workspace` file exists before calling `code` command?
   - **Current behavior**: WorkspaceLauncherService already validates file existence
   - **Recommended**: Keep this validation

## Success Criteria

- [ ] Command can be invoked as `homelab workspace <name> vscode <context>`
- [ ] Command validates workspace exists in PocketBase
- [ ] Command validates context exists for the workspace
- [ ] Command launches VSCode with correct workspace file path
- [ ] All terminal-related code is removed
- [ ] Tests updated and passing
- [ ] Spec updated with new requirements
- [ ] No regression in existing workspace list command

## Related Changes

- **Depends on**: None (standalone refactoring)
- **Blocks**: Future terminal command implementation
- **Related to**: `add-workspace-start` (refactors output of this change)
