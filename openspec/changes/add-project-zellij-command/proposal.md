# Add Project Zellij Command

## Why

Users need a convenient way to open Zellij terminal multiplexer sessions for specific projects with custom configurations. Currently, users must manually navigate to project directories and execute lengthy Zellij commands with specific configuration paths. This proposal adds a `homelab project zellij` command that simplifies this workflow by leveraging existing project detection utilities and following the same argument patterns as the `project vscode` command.

## What Changes

- Add new command `homelab project zellij [project-name] [config-name]` in `src/commands/project/zellij.ts`
- Command accepts two optional positional arguments with intelligent defaults:
  - `project-name`: Defaults to current project detected from working directory
  - `config-name`: Defaults to current working directory basename
- Command executes `zellij -n ~/projects/<project-name>/.config/zellij/<config-name>.kdl -s <config-name>`
- Reuses existing utilities:
  - `detectCurrentProject()` from `src/utils/detect-current-project.ts` for project detection
  - `loadProjectsDirConfig()` from `src/config/projects-dir.config.ts` for projects directory path
- Follows command-only architecture pattern (no service/repository layers needed)
- Includes comprehensive tests in `test/commands/project/zellij.test.ts`

## Impact

- **Affected specs**: Creates new capability `project-zellij-integration`
- **Affected code**:
  - New file: `src/commands/project/zellij.ts` (primary implementation)
  - New file: `test/commands/project/zellij.test.ts` (test coverage)
  - Reused: `src/utils/detect-current-project.ts` (no changes)
  - Reused: `src/config/projects-dir.config.ts` (no changes)
  - Reused: `src/lib/base-command.ts` (no changes)
- **User impact**: Provides faster workflow for opening Zellij sessions with project-specific configurations
- **Breaking changes**: None - this is a new additive feature
