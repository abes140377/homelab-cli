# Proposal: add-project-vscode-command

## Overview

Add a `homelab project vscode [project-name] [workspace-name]` command that opens VS Code workspaces for projects. This command will:

- Open a specific `.code-workspace` file when both project and workspace names are provided
- Auto-detect the current project from the working directory when project name is omitted
- Open the project root directory when workspace name is omitted
- Provide intuitive argument handling for common developer workflows

## Motivation

Developers working with multiple projects and workspaces need a quick way to open VS Code environments without manually navigating to workspace files or remembering full paths. This command streamlines the workflow by:

1. Eliminating manual path construction for `.code-workspace` files
2. Leveraging existing project auto-detection logic
3. Supporting both explicit and implicit argument patterns
4. Following the established CLI patterns (similar to `project module list`)

## Scope

### In Scope

- Command implementation: `homelab project vscode [project-name] [workspace-name]`
- Auto-detection of current project using existing `detectCurrentProject` utility
- Path resolution using existing `loadProjectsDirConfig` configuration
- Execute VS Code via `code` CLI with proper error handling
- Comprehensive test coverage for all argument combinations

### Out of Scope

- Creating or managing `.code-workspace` files (user responsibility)
- Validating that workspace files exist before opening (VS Code handles this)
- Installing or configuring VS Code itself
- Supporting other editors (vim, emacs, etc.) - could be future work

## Dependencies

### Existing Code to Reuse

- `src/utils/detect-current-project.ts` - Project name detection from working directory
- `src/config/projects-dir.config.ts` - Projects directory configuration
- `src/lib/base-command.ts` - Base command class
- Node.js `child_process` module - For executing `code` binary

### No Service/Repository Layer Needed

This is a simple shell command execution, so it follows the "command-only" pattern per the architecture guidelines. No service or repository layer is required.

## Changes

This proposal modifies the following specs:

- **MODIFIED**: `project-vscode-integration` - Add requirements for command implementation and execution

## Related Changes

None. This is a standalone feature addition.

## Open Questions

None. The design is straightforward and follows existing patterns.

## Risk Assessment

**Low Risk**

- Uses existing, tested utilities (`detectCurrentProject`, `loadProjectsDirConfig`)
- Simple command execution with well-defined error handling
- No changes to existing services or repositories
- VS Code process runs detached, so CLI doesn't wait for editor to close
