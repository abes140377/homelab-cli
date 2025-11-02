# project-vscode-integration Specification

## Purpose
TBD - created by archiving change add-project-vscode-command. Update Purpose after archive.
## Requirements
### Requirement: VSCode Command Execution

The system SHALL provide a command that launches Visual Studio Code for a specified project workspace by executing the `code` CLI binary.

#### Scenario: Open workspace with explicit project and workspace name

- **GIVEN** command `homelab project vscode sflab my-workspace`
- **WHEN** the command executes
- **THEN** it SHALL construct path `~/projects/sflab/my-workspace.code-workspace`
- **AND** it SHALL execute `code ~/projects/sflab/my-workspace.code-workspace`
- **AND** it SHALL exit with status 0 on success

#### Scenario: Open workspace with auto-detected project

- **GIVEN** command `homelab project vscode my-workspace` executed in directory `~/projects/sflab/src/homelab-cli`
- **WHEN** the command executes
- **THEN** it SHALL detect project name as "sflab" using `detectCurrentProject` utility
- **AND** it SHALL construct path `~/projects/sflab/my-workspace.code-workspace`
- **AND** it SHALL execute `code ~/projects/sflab/my-workspace.code-workspace`
- **AND** it SHALL exit with status 0 on success

#### Scenario: Open project root without workspace

- **GIVEN** command `homelab project vscode sflab`
- **WHEN** the command executes
- **THEN** it SHALL change to directory `~/projects/sflab`
- **AND** it SHALL execute `code .` in that directory
- **AND** it SHALL exit with status 0 on success

#### Scenario: Open current project root without any arguments

- **GIVEN** command `homelab project vscode` executed in directory `~/projects/sflab/src/homelab-cli`
- **WHEN** the command executes
- **THEN** it SHALL detect project name as "sflab" using `detectCurrentProject` utility
- **AND** it SHALL change to directory `~/projects/sflab`
- **AND** it SHALL execute `code .` in that directory
- **AND** it SHALL exit with status 0 on success

#### Scenario: Handle missing code binary

- **GIVEN** the `code` command is not available in PATH
- **WHEN** the command attempts to execute `code`
- **THEN** it SHALL display error "VSCode CLI 'code' command not found. Please ensure VSCode is installed and 'code' is in your PATH."
- **AND** it SHALL exit with status 1

#### Scenario: Handle project detection failure

- **GIVEN** command `homelab project vscode` executed outside projects directory (e.g., `/tmp`)
- **WHEN** project auto-detection fails
- **THEN** it SHALL display error "Could not detect current project. Please provide a project name or run the command from within a project directory."
- **AND** it SHALL exit with status 1

#### Scenario: Handle code command execution failure

- **GIVEN** the `code` command exits with non-zero status
- **WHEN** execution fails
- **THEN** it SHALL display error "Failed to open VSCode: <error message>"
- **AND** it SHALL exit with status 1

### Requirement: Project VSCode Command Arguments

The `homelab project vscode` command SHALL accept two optional positional arguments with auto-detection fallback behavior.

#### Scenario: Both arguments provided

- **GIVEN** command `homelab project vscode myproject myworkspace`
- **WHEN** the command parses arguments
- **THEN** it SHALL use "myproject" as project name
- **AND** it SHALL use "myworkspace" as workspace name
- **AND** it SHALL open `~/projects/myproject/myworkspace.code-workspace`

#### Scenario: Only project name provided

- **GIVEN** command `homelab project vscode myproject`
- **WHEN** the command parses arguments
- **THEN** it SHALL use "myproject" as project name
- **AND** it SHALL detect that workspace name is omitted
- **AND** it SHALL open project directory with `code .` in `~/projects/myproject`

#### Scenario: Only workspace name provided

- **GIVEN** command `homelab project vscode myworkspace` executed in `~/projects/currentproj/src`
- **WHEN** the command parses arguments
- **THEN** it SHALL auto-detect project name as "currentproj"
- **AND** it SHALL use "myworkspace" as workspace name
- **AND** it SHALL open `~/projects/currentproj/myworkspace.code-workspace`

#### Scenario: No arguments provided

- **GIVEN** command `homelab project vscode` executed in `~/projects/currentproj/src`
- **WHEN** the command parses arguments
- **THEN** it SHALL auto-detect project name as "currentproj"
- **AND** it SHALL detect that workspace name is omitted
- **AND** it SHALL open project directory with `code .` in `~/projects/currentproj`

### Requirement: Path Resolution

The command SHALL construct filesystem paths based on configured projects directory and provided/detected project and workspace names.

#### Scenario: Workspace file path construction

- **GIVEN** projects directory is `~/projects` (from config)
- **AND** project name is "sflab"
- **AND** workspace name is "homelab"
- **WHEN** constructing workspace path
- **THEN** it SHALL expand `~` to user home directory
- **AND** it SHALL construct absolute path `<home>/projects/sflab/homelab.code-workspace`
- **AND** it SHALL append `.code-workspace` extension to workspace name

#### Scenario: Project directory path construction

- **GIVEN** projects directory is `~/projects` (from config)
- **AND** project name is "sflab"
- **AND** workspace name is omitted
- **WHEN** constructing project path
- **THEN** it SHALL expand `~` to user home directory
- **AND** it SHALL construct absolute path `<home>/projects/sflab`

#### Scenario: Use projects directory configuration

- **GIVEN** the command needs projects directory path
- **WHEN** loading configuration
- **THEN** it SHALL use `loadProjectsDirConfig()` utility
- **AND** it SHALL handle configuration errors by displaying error message
- **AND** it SHALL exit with status 1 on configuration failure

### Requirement: Architecture Consistency

The VSCode command SHALL follow the established project architecture patterns for simple command-only operations.

#### Scenario: Command-only architecture

- **GIVEN** the VSCode command is a simple shell execution
- **WHEN** implementing the feature
- **THEN** it SHALL implement logic directly in the command class (no service/repository layer needed)
- **AND** it SHALL extend `BaseCommand` from `src/lib/base-command.ts`
- **AND** it SHALL use existing utilities (`detectCurrentProject`, `loadProjectsDirConfig`)
- **AND** it SHALL use Node.js built-in `child_process` module for command execution

#### Scenario: Reuse existing utilities

- **GIVEN** the command needs project detection
- **WHEN** implementing auto-detection
- **THEN** it SHALL use `detectCurrentProject` from `src/utils/detect-current-project.ts`
- **AND** it SHALL use `loadProjectsDirConfig` from `src/config/projects-dir.config.ts`
- **AND** it SHALL NOT duplicate detection logic

#### Scenario: Follow oclif conventions

- **GIVEN** the command implementation
- **WHEN** defining the command
- **THEN** it SHALL use `static args` to define positional arguments
- **AND** it SHALL use `static description` to describe the command
- **AND** it SHALL use `static examples` to provide usage examples
- **AND** it SHALL implement `async run()` method for command logic

### Requirement: Process Execution

The command SHALL execute the VSCode `code` binary using Node.js child process with proper error handling.

#### Scenario: Execute code with workspace file

- **GIVEN** workspace path is `/Users/user/projects/sflab/homelab.code-workspace`
- **WHEN** executing VSCode
- **THEN** it SHALL use `spawn` from `child_process` module
- **AND** it SHALL execute `code` with argument `/Users/user/projects/sflab/homelab.code-workspace`
- **AND** it SHALL detach the process so it runs independently
- **AND** it SHALL NOT wait for VSCode to close

#### Scenario: Execute code with project directory

- **GIVEN** project directory is `/Users/user/projects/sflab`
- **WHEN** executing VSCode
- **THEN** it SHALL use `spawn` from `child_process` module
- **AND** it SHALL execute `code` with argument `.`
- **AND** it SHALL set working directory to `/Users/user/projects/sflab`
- **AND** it SHALL detach the process so it runs independently
- **AND** it SHALL NOT wait for VSCode to close

#### Scenario: Handle spawn errors

- **GIVEN** `spawn` throws an error
- **WHEN** attempting to execute `code`
- **THEN** it SHALL catch the error
- **AND** it SHALL check for ENOENT error code (command not found)
- **AND** it SHALL display appropriate error message
- **AND** it SHALL exit with status 1

### Requirement: User Experience

The command SHALL provide clear feedback and intuitive argument handling for common workflows.

#### Scenario: Display helpful examples

- **GIVEN** user runs `homelab project vscode --help`
- **WHEN** help is displayed
- **THEN** it SHALL show example: `homelab project vscode` (auto-detect both)
- **AND** it SHALL show example: `homelab project vscode myworkspace` (auto-detect project)
- **AND** it SHALL show example: `homelab project vscode sflab` (open project root)
- **AND** it SHALL show example: `homelab project vscode sflab homelab` (explicit workspace)

#### Scenario: Provide clear error messages

- **GIVEN** any error condition
- **WHEN** displaying error to user
- **THEN** it SHALL include actionable guidance (e.g., "ensure VSCode is installed")
- **AND** it SHALL specify what went wrong
- **AND** it SHALL suggest next steps when applicable

### Requirement: Testing Coverage

The VSCode command SHALL include comprehensive tests covering all argument combinations and error cases.

#### Scenario: Command tests structure

- **GIVEN** test file `test/commands/project/vscode.test.ts`
- **THEN** it SHALL test explicit project and workspace arguments
- **AND** it SHALL test auto-detected project with explicit workspace
- **AND** it SHALL test explicit project without workspace (code .)
- **AND** it SHALL test auto-detected project without workspace
- **AND** it SHALL test error: missing code binary
- **AND** it SHALL test error: project detection failure
- **AND** it SHALL test error: spawn execution failure

#### Scenario: Mock child_process for tests

- **GIVEN** tests need to verify code execution
- **WHEN** writing tests
- **THEN** tests SHALL mock `child_process.spawn` to avoid actually launching VSCode
- **AND** tests SHALL verify correct command and arguments are passed to spawn
- **AND** tests SHALL verify working directory is set correctly
- **AND** tests SHALL simulate spawn errors for error case testing
