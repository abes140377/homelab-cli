# config-commands Specification

## Purpose
TBD - created by archiving change integrate-configstore-for-persistent-config. Update Purpose after archive.
## Requirements
### Requirement: Config Read Command

The system SHALL provide a `homelab config read [key]` command that displays configuration values from the CliConfigManager, supporting both specific keys and all configuration.

#### Scenario: Read all configuration values

- **GIVEN** command `homelab config read`
- **AND** configuration has logLevel='debug' and colorOutput=true
- **WHEN** the command executes
- **THEN** it SHALL call getCliConfig().getAll()
- **AND** it SHALL output JSON-formatted configuration with all keys
- **AND** output SHALL be formatted with 2-space indentation
- **AND** it SHALL exit with status 0

#### Scenario: Read specific configuration key

- **GIVEN** command `homelab config read logLevel`
- **AND** logLevel='warn' in configuration
- **WHEN** the command executes
- **THEN** it SHALL call getCliConfig().get('logLevel')
- **AND** it SHALL output "logLevel: warn"
- **AND** it SHALL exit with status 0

#### Scenario: Read configuration shows environment variable overrides

- **GIVEN** configstore has logLevel='info'
- **AND** HOMELAB_LOG_LEVEL='debug' environment variable is set
- **WHEN** command `homelab config read logLevel` executes
- **THEN** it SHALL output "logLevel: debug"
- **AND** it SHALL reflect the environment variable override

#### Scenario: Read non-existent configuration key

- **GIVEN** command `homelab config read nonExistentKey`
- **WHEN** the command executes
- **THEN** it SHALL call get('nonExistentKey')
- **AND** it SHALL output "nonExistentKey: undefined" or handle gracefully
- **AND** it SHALL exit with status 0

### Requirement: Config Read Path Flag

The system SHALL provide a `--path` flag for the config read command that displays the location of the configuration file.

#### Scenario: Display config file path

- **GIVEN** command `homelab config read --path`
- **WHEN** the command executes
- **THEN** it SHALL call getCliConfig().getPath()
- **AND** it SHALL output "Config file: /path/to/config.json"
- **AND** it SHALL not display configuration values
- **AND** it SHALL exit with status 0

#### Scenario: Path flag with key argument

- **GIVEN** command `homelab config read logLevel --path`
- **WHEN** the command executes
- **THEN** it SHALL prioritize the --path flag
- **AND** it SHALL display only the config file path
- **AND** it SHALL ignore the key argument

### Requirement: Config Write Command

The system SHALL provide a `homelab config write <key> <value>` command that persists configuration values to the configstore.

#### Scenario: Write string configuration value

- **GIVEN** command `homelab config write logLevel error`
- **WHEN** the command executes
- **THEN** it SHALL call getCliConfig().set('logLevel', 'error')
- **AND** it SHALL output "Set logLevel = error"
- **AND** it SHALL output "Config file: /path/to/config.json"
- **AND** the value SHALL be persisted to configstore
- **AND** it SHALL exit with status 0

#### Scenario: Write boolean configuration value (true)

- **GIVEN** command `homelab config write colorOutput true`
- **WHEN** the command executes
- **THEN** it SHALL parse 'true' string as boolean true
- **AND** it SHALL call getCliConfig().set('colorOutput', true)
- **AND** it SHALL output "Set colorOutput = true"
- **AND** the boolean value SHALL be persisted to configstore

#### Scenario: Write boolean configuration value (false)

- **GIVEN** command `homelab config write colorOutput false`
- **WHEN** the command executes
- **THEN** it SHALL parse 'false' string as boolean false
- **AND** it SHALL call getCliConfig().set('colorOutput', false)
- **AND** it SHALL output "Set colorOutput = false"

#### Scenario: Write value shows config file location

- **GIVEN** command `homelab config write logLevel info`
- **WHEN** the command executes
- **THEN** it SHALL output the config file path after setting the value
- **AND** users SHALL know where their configuration is stored

### Requirement: Config Write Argument Validation

The system SHALL require both key and value arguments for the config write command and validate them appropriately.

#### Scenario: Write command requires key and value

- **GIVEN** command `homelab config write`
- **WHEN** the command is invoked
- **THEN** oclif SHALL display error "Missing required arg: key"
- **AND** it SHALL exit with non-zero status

#### Scenario: Write command requires value

- **GIVEN** command `homelab config write logLevel`
- **WHEN** the command is invoked
- **THEN** oclif SHALL display error "Missing required arg: value"
- **AND** it SHALL exit with non-zero status

#### Scenario: Write command accepts any key

- **GIVEN** command `homelab config write customKey customValue`
- **WHEN** the command executes
- **THEN** it SHALL call set('customKey', 'customValue')
- **AND** the value SHALL be persisted
- **AND** this allows for extensibility and custom configuration

### Requirement: Config Command Structure

The system SHALL organize config commands under the `homelab config` namespace following oclif directory conventions.

#### Scenario: Command file structure

- **GIVEN** the commands directory structure
- **THEN** config read SHALL be defined in `src/commands/config/read.ts`
- **AND** config write SHALL be defined in `src/commands/config/write.ts`
- **AND** commands SHALL extend BaseCommand
- **AND** commands SHALL compile to `dist/commands/config/`

#### Scenario: Command help documentation

- **GIVEN** command `homelab config --help`
- **WHEN** the help is displayed
- **THEN** it SHALL show available config subcommands (read, write)
- **AND** each subcommand SHALL have a clear description

#### Scenario: Config read help

- **GIVEN** command `homelab config read --help`
- **WHEN** the help is displayed
- **THEN** it SHALL show description "Read configuration values"
- **AND** it SHALL document the optional [key] argument
- **AND** it SHALL document the --path flag

#### Scenario: Config write help

- **GIVEN** command `homelab config write --help`
- **WHEN** the help is displayed
- **THEN** it SHALL show description "Write configuration values"
- **AND** it SHALL document the required <key> argument
- **AND** it SHALL document the required <value> argument

### Requirement: Type-Aware Value Parsing

The system SHALL parse configuration values based on their type for the config write command, supporting at minimum strings and booleans.

#### Scenario: Parse boolean value 'true'

- **GIVEN** value argument 'true'
- **WHEN** parsing the value for persistence
- **THEN** it SHALL detect the string 'true'
- **AND** it SHALL convert to boolean true
- **AND** configstore SHALL store boolean type

#### Scenario: Parse boolean value 'false'

- **GIVEN** value argument 'false'
- **WHEN** parsing the value for persistence
- **THEN** it SHALL detect the string 'false'
- **AND** it SHALL convert to boolean false
- **AND** configstore SHALL store boolean type

#### Scenario: Parse string value

- **GIVEN** value argument 'debug'
- **WHEN** parsing the value for persistence
- **THEN** it SHALL treat the value as a string
- **AND** no type conversion SHALL be applied
- **AND** configstore SHALL store string type

#### Scenario: Parse numeric-looking string

- **GIVEN** value argument '8006'
- **WHEN** parsing the value for persistence
- **THEN** it SHALL treat the value as a string (for PoC simplicity)
- **AND** configstore SHALL store '8006' as string
- **AND** future enhancements MAY add number parsing

### Requirement: Config Commands Integration with BaseCommand

The system SHALL integrate config commands with the BaseCommand class for consistent error handling and logging.

#### Scenario: Config commands extend BaseCommand

- **GIVEN** ConfigRead and ConfigWrite commands
- **THEN** they SHALL extend BaseCommand<typeof CommandClass>
- **AND** they SHALL use this.parse() for argument/flag parsing
- **AND** they SHALL use this.log() for output
- **AND** they SHALL use this.error() for error handling

#### Scenario: Config command uses global flags

- **GIVEN** command `homelab config read --log-level debug`
- **WHEN** the command executes
- **THEN** it SHALL respect the global --log-level flag from BaseCommand
- **AND** BaseCommand behavior SHALL apply to config commands

### Requirement: Config Commands Testing

The system SHALL provide comprehensive tests for config commands using oclif test utilities and mocking configstore.

#### Scenario: Test config read command with runCommand

- **GIVEN** a test using runCommand from @oclif/test
- **WHEN** runCommand('config read') is called
- **THEN** it SHALL execute the command
- **AND** stdout SHALL contain configuration output
- **AND** test SHALL verify JSON formatting

#### Scenario: Test config write command persistence

- **GIVEN** a test using runCommand from @oclif/test
- **WHEN** runCommand('config write logLevel warn') is called
- **THEN** it SHALL execute the command
- **AND** configstore SHALL be updated
- **AND** subsequent read SHALL return the written value

#### Scenario: Mock configstore in tests

- **GIVEN** unit tests for config commands
- **THEN** tests SHALL use an in-memory or mock configstore
- **AND** tests SHALL not write to actual user config file
- **AND** tests SHALL be isolated and repeatable
