# persistent-config-management Specification

## Purpose
Provides persistent configuration storage using the configstore npm package with environment variable overrides, enabling users to configure the CLI once and have settings persist across sessions.

## ADDED Requirements

### Requirement: ConfigStore Manager Class

The system SHALL provide a CliConfigManager class that manages persistent configuration using configstore with support for environment variable overrides and default values from Zod schemas.

#### Scenario: Initialize config manager

- **GIVEN** the homelab-cli application
- **WHEN** CliConfigManager is instantiated
- **THEN** it SHALL create a Configstore instance with package name 'homelab-cli'
- **AND** configstore SHALL automatically determine the platform-specific config file location
- **AND** the config file SHALL be created if it doesn't exist

#### Scenario: Get config file path

- **GIVEN** an initialized CliConfigManager
- **WHEN** getPath() is called
- **THEN** it SHALL return the absolute path to the config file
- **AND** the path SHALL be platform-specific (XDG on Linux, ~/Library/Preferences on macOS, %APPDATA% on Windows)

### Requirement: Configuration Value Retrieval with Precedence

The system SHALL retrieve configuration values following a three-tier precedence: environment variables (highest), configstore (middle), defaults from Zod schema (lowest).

#### Scenario: Get value from environment variable

- **GIVEN** environment variable HOMELAB_LOG_LEVEL='debug'
- **AND** configstore has logLevel='info'
- **WHEN** get('logLevel') is called
- **THEN** it SHALL return 'debug'
- **AND** it SHALL prioritize the environment variable over configstore

#### Scenario: Get value from configstore

- **GIVEN** no HOMELAB_LOG_LEVEL environment variable
- **AND** configstore has logLevel='warn'
- **WHEN** get('logLevel') is called
- **THEN** it SHALL return 'warn'
- **AND** it SHALL use the configstore value

#### Scenario: Get value from schema defaults

- **GIVEN** no HOMELAB_LOG_LEVEL environment variable
- **AND** configstore has no logLevel value
- **WHEN** get('logLevel') is called
- **THEN** it SHALL return 'info'
- **AND** it SHALL use the default from CliConfigSchema

#### Scenario: Get all configuration values

- **GIVEN** mixed configuration sources (env vars, configstore, defaults)
- **WHEN** getAll() is called
- **THEN** it SHALL return an object with all configuration keys
- **AND** each value SHALL follow the precedence rules (env > configstore > default)
- **AND** the returned type SHALL match CliConfig from Zod schema

### Requirement: Configuration Value Persistence

The system SHALL persist configuration values to the configstore file, making them available across CLI invocations.

#### Scenario: Set configuration value

- **GIVEN** a CliConfigManager instance
- **WHEN** set('logLevel', 'error') is called
- **THEN** it SHALL write the value to configstore
- **AND** the config file SHALL be updated on disk
- **AND** subsequent get('logLevel') calls SHALL return 'error' (unless overridden by env var)

#### Scenario: Set multiple configuration values

- **GIVEN** a CliConfigManager instance
- **WHEN** set('logLevel', 'debug') and set('colorOutput', false) are called
- **THEN** both values SHALL be persisted to configstore
- **AND** getAll() SHALL return both updated values

#### Scenario: Persist across sessions

- **GIVEN** set('logLevel', 'warn') was called in previous CLI invocation
- **WHEN** a new CliConfigManager instance is created
- **THEN** get('logLevel') SHALL return 'warn'
- **AND** the persisted value SHALL be retrieved from the config file

### Requirement: Environment Variable Override

The system SHALL allow environment variables to override configstore values without modifying the persisted configuration.

#### Scenario: Override persisted value with environment variable

- **GIVEN** configstore has colorOutput=false
- **AND** environment variable HOMELAB_COLOR_OUTPUT='true'
- **WHEN** get('colorOutput') is called
- **THEN** it SHALL return true
- **AND** configstore SHALL remain unchanged (colorOutput=false)

#### Scenario: Environment variable precedence is transient

- **GIVEN** HOMELAB_LOG_LEVEL='debug' environment variable
- **AND** configstore has logLevel='info'
- **WHEN** get('logLevel') is called
- **THEN** it SHALL return 'debug'
- **WHEN** the environment variable is removed and a new instance is created
- **THEN** get('logLevel') SHALL return 'info' from configstore

### Requirement: Type-Safe Configuration Schema

The system SHALL define configuration structure using Zod schemas for type safety and validation.

#### Scenario: Define CLI configuration schema

- **GIVEN** the CliConfigSchema
- **THEN** it SHALL define logLevel as enum ['debug', 'info', 'warn', 'error'] with default 'info'
- **AND** it SHALL define colorOutput as boolean with default true
- **AND** the CliConfig type SHALL be inferred from the schema using z.infer

#### Scenario: Validate configuration values

- **GIVEN** a configuration value being set
- **WHEN** the value is parsed through the schema
- **THEN** invalid values SHALL be rejected with descriptive Zod errors
- **AND** valid values SHALL be accepted and typed correctly

### Requirement: Singleton Configuration Instance

The system SHALL provide a singleton instance of CliConfigManager via getCliConfig() to ensure consistent state across the application.

#### Scenario: Get singleton instance

- **GIVEN** no CliConfigManager instance exists
- **WHEN** getCliConfig() is called
- **THEN** it SHALL create and return a new CliConfigManager instance
- **AND** the instance SHALL be cached for subsequent calls

#### Scenario: Reuse singleton instance

- **GIVEN** getCliConfig() was called previously
- **WHEN** getCliConfig() is called again
- **THEN** it SHALL return the same instance
- **AND** no new Configstore instance SHALL be created

#### Scenario: Consistent state across application

- **GIVEN** getCliConfig() is called from multiple commands
- **WHEN** configuration is modified via set()
- **THEN** all commands SHALL see the updated configuration
- **AND** the singleton SHALL ensure a single source of truth

### Requirement: Environment Variable Naming Convention

The system SHALL use HOMELAB_ prefix for environment variable overrides to avoid conflicts and maintain consistency.

#### Scenario: Map config key to environment variable

- **GIVEN** config key 'logLevel'
- **WHEN** checking for environment override
- **THEN** it SHALL check HOMELAB_LOG_LEVEL environment variable
- **AND** the key SHALL be converted to uppercase

#### Scenario: Map config key with camelCase to environment variable

- **GIVEN** config key 'colorOutput'
- **WHEN** checking for environment override
- **THEN** it SHALL check HOMELAB_COLOR_OUTPUT environment variable
- **AND** camelCase SHALL be converted to UPPER_SNAKE_CASE

### Requirement: Type-Aware Environment Variable Parsing

The system SHALL parse environment variable values according to their expected types in the configuration schema.

#### Scenario: Parse boolean environment variable

- **GIVEN** HOMELAB_COLOR_OUTPUT='true'
- **WHEN** get('colorOutput') is called
- **THEN** it SHALL parse 'true' string as boolean true
- **AND** 'false' string SHALL be parsed as boolean false

#### Scenario: Parse string environment variable

- **GIVEN** HOMELAB_LOG_LEVEL='debug'
- **WHEN** get('logLevel') is called
- **THEN** it SHALL return 'debug' as string
- **AND** no type conversion SHALL be applied

#### Scenario: Handle invalid enum values

- **GIVEN** HOMELAB_LOG_LEVEL='invalid'
- **WHEN** get('logLevel') is called
- **THEN** it SHALL return 'invalid' as-is
- **AND** validation errors SHALL be handled by consuming code if needed
