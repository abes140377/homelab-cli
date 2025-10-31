# Add Workspace Start Command

## Why

The homelab-cli currently supports listing workspaces from PocketBase, but users must manually navigate to workspace directories and open development environments. To streamline the developer workflow, we need a command that can quickly start a workspace in either VSCode (with proper workspace context) or terminal, based on workspace data stored in PocketBase.

The PocketBase 'workspaces' collection has been extended with a 'contexts' relation that stores available development contexts for each workspace. Each context has a 'name' attribute that corresponds to a `.code-workspace` file in the workspace directory structure at `~/projects/<workspace-name>/`.

## What Changes

- Extend workspace domain model to include contexts (one-to-many relationship)
- Create context domain model with Zod schema for validation
- Implement `homelab workspace start <workspace-name>` command with mutually exclusive flags:
  - `--vscode`: Opens VSCode with selected workspace context
  - `--terminal`: Opens workspace directory in terminal
- Add `--context` flag for selecting which context to open when using `--vscode`
- Fetch workspace and contexts data from PocketBase via repository pattern
- Execute shell commands (`code` for VSCode, `cd` for terminal) to launch environments
- Follow existing layered architecture (Command → Service → Repository)
- Add comprehensive tests for all layers

## Impact

- Affected specs:
  - New capability `workspace-start` (adds workspace starting functionality)
  - Modified: `workspace-management` (extends workspace model with contexts)
  - Modified: `pocketbase-workspace-listing` (extends repository to fetch contexts relation)
- Affected code:
  - New: `src/models/workspace-context.dto.ts` (context DTO)
  - New: `src/models/schemas/workspace-context.schema.ts` (Zod schema for context)
  - Modified: `src/models/schemas/workspace.schema.ts` (add optional contexts field)
  - Modified: `src/models/workspace.dto.ts` (update to include contexts)
  - Modified: `src/repositories/pocketbase-workspace.repository.ts` (expand fetch to include contexts)
  - Modified: `src/repositories/interfaces/workspace.repository.interface.ts` (add findByName method)
  - New: `src/services/workspace-launcher.service.ts` (handles VSCode/terminal launching logic)
  - New: `src/commands/workspace/start.ts` (CLI command)
  - New: `test/services/workspace-launcher.service.test.ts`
  - New: `test/commands/workspace/start.test.ts`
  - Modified: `test/repositories/pocketbase-workspace.repository.test.ts` (add tests for contexts)

## Dependencies

This change depends on:
- Existing PocketBase integration (pocketbase-workspace-listing spec)
- PocketBase 'workspaces' collection with 'contexts' relation already configured

## Success Criteria

- `homelab workspace start <workspace-name> --vscode` opens VSCode with selected context
- `homelab workspace start <workspace-name> --terminal` opens workspace directory in terminal
- Command requires exactly one of --vscode or --terminal (mutually exclusive)
- When --vscode is used with multiple contexts, --context flag is required to select one
- When --vscode is used with single context, it opens that context automatically
- Workspace directory path is constructed as `~/projects/<workspace-name>/`
- VSCode workspace file path is constructed as `~/projects/<workspace-name>/<context-name>.code-workspace`
- Clear error messages for:
  - Workspace not found in PocketBase
  - Invalid workspace name
  - Missing required flags
  - Context not found
  - VSCode or workspace directory not accessible
- All tests pass (unit, integration, command)
- Documentation is updated automatically via `pnpm run prepack`
