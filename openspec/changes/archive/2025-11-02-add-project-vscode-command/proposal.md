# Proposal: Add Project VSCode Command

## Why

Developers working with projects need a quick way to open VSCode workspaces without manually navigating filesystem paths. Currently, users must remember and type full paths like `code ~/projects/<project>/<workspace>.code-workspace` or navigate directories manually. This proposal adds a command to streamline this workflow by auto-detecting the current project and opening VSCode workspaces with a simple command.

## What Changes

- Add new command `homelab project vscode [project-name] [workspace-name]` that opens VSCode for a project workspace
- Support optional `project-name` argument (auto-detects from current working directory if omitted)
- Support optional `workspace-name` argument (opens project root with `code .` if omitted)
- When workspace name is provided, execute `code ~/projects/<project>/<workspace>.code-workspace`
- When workspace name is omitted, execute `code .` in the project directory `~/projects/<project>`
- Reuse existing `detectCurrentProject` utility for project auto-detection
- Follow established command architecture pattern (thin command layer, no service/repository needed for simple exec operations)

## Impact

- **Affected specs**: Creates new capability `project-vscode-integration`
- **Affected code**:
  - New command: `src/commands/project/vscode.ts`
  - Reuses: `src/utils/detect-current-project.ts`
  - Reuses: `src/config/projects-dir.config.ts`
- **Dependencies**: Requires Node.js `child_process` module (built-in, no new npm packages)
- **User impact**: Improved developer experience for opening VSCode workspaces
- **Breaking changes**: None (new command only)
