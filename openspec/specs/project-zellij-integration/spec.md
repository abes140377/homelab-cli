# project-zellij-integration Specification

## Purpose
TBD - created by archiving change add-project-zellij-command. Update Purpose after archive.
## Requirements
### Requirement: Zellij Command Execution

The system SHALL provide a command that launches Zellij terminal multiplexer sessions for a specified project with a custom configuration by executing the `zellij` CLI binary.

#### Scenario: Open Zellij with explicit project and config name

- **GIVEN** command `homelab project zellij sflab homelab-cli`
- **WHEN** the command executes
- **THEN** it SHALL construct config path `~/projects/sflab/.config/zellij/homelab-cli.kdl`
- **AND** it SHALL execute `zellij -n ~/projects/sflab/.config/zellij/homelab-cli.kdl -s homelab-cli`
- **AND** it SHALL exit with status 0 on success

#### Scenario: Open Zellij with auto-detected project

- **GIVEN** command `homelab project zellij homelab-cli` executed in directory `~/projects/sflab/src/foo`
- **WHEN** the command executes
- **THEN** it SHALL detect project name as "sflab" using `detectCurrentProject` utility
- **AND** it SHALL construct config path `~/projects/sflab/.config/zellij/homelab-cli.kdl`
- **AND** it SHALL execute `zellij -n ~/projects/sflab/.config/zellij/homelab-cli.kdl -s homelab-cli`
- **AND** it SHALL exit with status 0 on success

#### Scenario: Open Zellij with auto-detected config name

- **GIVEN** command `homelab project zellij sflab` executed in directory `~/projects/sflab/src/homelab-cli`
- **WHEN** the command executes
- **THEN** it SHALL detect config name as "homelab-cli" from current directory basename
- **AND** it SHALL construct config path `~/projects/sflab/.config/zellij/homelab-cli.kdl`
- **AND** it SHALL execute `zellij -n ~/projects/sflab/.config/zellij/homelab-cli.kdl -s homelab-cli`
- **AND** it SHALL exit with status 0 on success

#### Scenario: Open Zellij with auto-detected project and config

- **GIVEN** command `homelab project zellij` executed in directory `~/projects/sflab/src/homelab-cli`
- **WHEN** the command executes
- **THEN** it SHALL detect project name as "sflab" using `detectCurrentProject` utility
- **AND** it SHALL detect config name as "homelab-cli" from current directory basename
- **AND** it SHALL construct config path `~/projects/sflab/.config/zellij/homelab-cli.kdl`
- **AND** it SHALL execute `zellij -n ~/projects/sflab/.config/zellij/homelab-cli.kdl -s homelab-cli`
- **AND** it SHALL exit with status 0 on success

#### Scenario: Handle missing zellij binary

- **GIVEN** the `zellij` command is not available in PATH
- **WHEN** the command attempts to execute `zellij`
- **THEN** it SHALL display error "Zellij CLI 'zellij' command not found. Please ensure Zellij is installed and 'zellij' is in your PATH."
- **AND** it SHALL exit with status 1

#### Scenario: Handle project detection failure

- **GIVEN** command `homelab project zellij` executed outside projects directory (e.g., `/tmp`)
- **WHEN** project auto-detection fails
- **THEN** it SHALL display error "Could not detect current project. Please provide a project name or run the command from within a project directory."
- **AND** it SHALL exit with status 1

#### Scenario: Handle zellij command execution failure

- **GIVEN** the `zellij` command exits with non-zero status
- **WHEN** execution fails
- **THEN** it SHALL display error "Failed to open Zellij: <error message>"
- **AND** it SHALL exit with status 1

### Requirement: Project Zellij Command Arguments

The `homelab project zellij` command SHALL accept two optional positional arguments with auto-detection fallback behavior.

#### Scenario: Both arguments provided

- **GIVEN** command `homelab project zellij myproject myconfig`
- **WHEN** the command parses arguments
- **THEN** it SHALL use "myproject" as project name
- **AND** it SHALL use "myconfig" as config name
- **AND** it SHALL open Zellij with config `~/projects/myproject/.config/zellij/myconfig.kdl` and session name "myconfig"

#### Scenario: Only project name provided

- **GIVEN** command `homelab project zellij myproject` executed in `~/projects/myproject/src/my-module`
- **WHEN** the command parses arguments
- **THEN** it SHALL use "myproject" as project name
- **AND** it SHALL detect config name as "my-module" from current directory basename
- **AND** it SHALL open Zellij with config `~/projects/myproject/.config/zellij/my-module.kdl` and session name "my-module"

#### Scenario: Only config name provided

- **GIVEN** command `homelab project zellij myconfig` executed in `~/projects/currentproj/src/foo`
- **WHEN** the command parses arguments
- **THEN** it SHALL auto-detect project name as "currentproj"
- **AND** it SHALL use "myconfig" as config name
- **AND** it SHALL open Zellij with config `~/projects/currentproj/.config/zellij/myconfig.kdl` and session name "myconfig"

#### Scenario: No arguments provided

- **GIVEN** command `homelab project zellij` executed in `~/projects/currentproj/src/my-module`
- **WHEN** the command parses arguments
- **THEN** it SHALL auto-detect project name as "currentproj"
- **AND** it SHALL detect config name as "my-module" from current directory basename
- **AND** it SHALL open Zellij with config `~/projects/currentproj/.config/zellij/my-module.kdl` and session name "my-module"

### Requirement: Config Name Detection from Working Directory

The command SHALL detect the config name from the current working directory basename when not explicitly provided.

#### Scenario: Detect config from nested directory

- **GIVEN** current working directory is `~/projects/sflab/src/homelab-cli/test/commands`
- **AND** config name argument is omitted
- **WHEN** detecting config name
- **THEN** it SHALL use basename of current directory "commands"
- **AND** it SHALL use "commands" as the config name

#### Scenario: Detect config from project root

- **GIVEN** current working directory is `~/projects/sflab`
- **AND** config name argument is omitted
- **WHEN** detecting config name
- **THEN** it SHALL use basename of current directory "sflab"
- **AND** it SHALL use "sflab" as the config name

#### Scenario: Use explicit config over detection

- **GIVEN** current working directory is `~/projects/sflab/src/homelab-cli`
- **AND** config name argument is "custom-config"
- **WHEN** determining config name
- **THEN** it SHALL use "custom-config" as the config name
- **AND** it SHALL NOT use "homelab-cli" from directory basename

### Requirement: Zellij Configuration Path Resolution

The command SHALL construct Zellij configuration file paths based on configured projects directory, project name, and config name.

#### Scenario: Config file path construction

- **GIVEN** projects directory is `~/projects` (from config)
- **AND** project name is "sflab"
- **AND** config name is "homelab-cli"
- **WHEN** constructing config path
- **THEN** it SHALL expand `~` to user home directory
- **AND** it SHALL construct absolute path `<home>/projects/sflab/.config/zellij/homelab-cli.kdl`
- **AND** it SHALL append `.kdl` extension to config name

#### Scenario: Use projects directory configuration

- **GIVEN** the command needs projects directory path
- **WHEN** loading configuration
- **THEN** it SHALL use `loadProjectsDirConfig()` utility
- **AND** it SHALL handle configuration errors by displaying error message
- **AND** it SHALL exit with status 1 on configuration failure

### Requirement: Architecture Consistency

The Zellij command SHALL follow the established project architecture patterns for simple command-only operations.

#### Scenario: Command-only architecture

- **GIVEN** the Zellij command is a simple shell execution
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

### Requirement: Zellij Process Execution

The command SHALL execute the Zellij `zellij` binary using Node.js child process with proper Zellij-specific arguments.

#### Scenario: Execute zellij with config and session

- **GIVEN** config path is `/Users/user/projects/sflab/.config/zellij/homelab-cli.kdl`
- **AND** session name is "homelab-cli"
- **WHEN** executing Zellij
- **THEN** it SHALL use `spawn` from `child_process` module
- **AND** it SHALL execute `zellij` with arguments `-n`, `/Users/user/projects/sflab/.config/zellij/homelab-cli.kdl`, `-s`, `homelab-cli`
- **AND** it SHALL inherit stdio from parent process so Zellij runs interactively
- **AND** it SHALL wait for Zellij to close (NOT detached like VSCode)

#### Scenario: Handle spawn errors

- **GIVEN** `spawn` throws an error
- **WHEN** attempting to execute `zellij`
- **THEN** it SHALL catch the error
- **AND** it SHALL check for ENOENT error code (command not found)
- **AND** it SHALL display appropriate error message
- **AND** it SHALL exit with status 1

#### Scenario: Inherit stdio for interactive session

- **GIVEN** Zellij needs to run interactively with terminal control
- **WHEN** spawning the process
- **THEN** it SHALL use `stdio: 'inherit'` to pass stdin/stdout/stderr to Zellij
- **AND** it SHALL NOT use `detached: true` (unlike VSCode command)
- **AND** it SHALL wait for the Zellij process to exit before command completes

### Requirement: User Experience

The command SHALL provide clear feedback and intuitive argument handling for common Zellij workflows.

#### Scenario: Display helpful examples

- **GIVEN** user runs `homelab project zellij --help`
- **WHEN** help is displayed
- **THEN** it SHALL show example: `homelab project zellij` (auto-detect both)
- **AND** it SHALL show example: `homelab project zellij myconfig` (auto-detect project)
- **AND** it SHALL show example: `homelab project zellij sflab` (auto-detect config from cwd)
- **AND** it SHALL show example: `homelab project zellij sflab homelab-cli` (explicit both)

#### Scenario: Provide clear error messages

- **GIVEN** any error condition
- **WHEN** displaying error to user
- **THEN** it SHALL include actionable guidance (e.g., "ensure Zellij is installed")
- **AND** it SHALL specify what went wrong
- **AND** it SHALL suggest next steps when applicable

### Requirement: Testing Coverage

The Zellij command SHALL include comprehensive tests covering all argument combinations and error cases.

#### Scenario: Command tests structure

- **GIVEN** test file `test/commands/project/zellij.test.ts`
- **THEN** it SHALL test explicit project and config arguments
- **AND** it SHALL test auto-detected project with explicit config
- **AND** it SHALL test explicit project with auto-detected config
- **AND** it SHALL test auto-detected project and config
- **AND** it SHALL test error: missing zellij binary
- **AND** it SHALL test error: project detection failure
- **AND** it SHALL test error: spawn execution failure

#### Scenario: Mock child_process for tests

- **GIVEN** tests need to verify zellij execution
- **WHEN** writing tests
- **THEN** tests SHALL mock `child_process.spawn` to avoid actually launching Zellij
- **AND** tests SHALL verify correct command and arguments are passed to spawn
- **AND** tests SHALL verify `-n <config-path> -s <session-name>` arguments format
- **AND** tests SHALL verify `stdio: 'inherit'` is set
- **AND** tests SHALL simulate spawn errors for error case testing
