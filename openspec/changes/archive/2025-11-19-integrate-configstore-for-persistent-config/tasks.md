# Implementation Tasks: ConfigStore Integration

## Prerequisites

- [x] Install configstore dependency: `pnpm add configstore`
- [x] Install @types/configstore dev dependency: `pnpm add -D @types/configstore`

## Phase 1: Configuration Schema

- [x] Create `src/models/schemas/cli-config.schema.ts` with Zod schema for CliConfig
  - [x] Define logLevel enum: ['debug', 'info', 'warn', 'error'] with default 'info'
  - [x] Define colorOutput boolean with default true
  - [x] Export CliConfigSchema and infer CliConfig type
- [x] Verify schema compiles: `pnpm run build`

## Phase 2: Configuration Manager

- [x] Create `src/config/cli.config.ts` with CliConfigManager class
  - [x] Implement constructor creating Configstore instance with package name 'homelab-cli'
  - [x] Implement get() method with precedence: environment variable > configstore > schema default
  - [x] Implement set() method to persist values to configstore
  - [x] Implement getAll() method returning all config values with precedence applied
  - [x] Implement getPath() method returning config file path
  - [x] Implement private getFromEnv() helper for environment variable parsing
  - [x] Implement private getDefault() helper for schema default values
  - [x] Export singleton getCliConfig() function
- [x] Write unit tests in `test/config/cli.config.test.ts`
  - [x] Test get() with environment variable override (highest priority)
  - [x] Test get() from configstore (middle priority)
  - [x] Test get() with schema defaults (lowest priority)
  - [x] Test set() persists to configstore
  - [x] Test getAll() returns all config with precedence
  - [x] Test getPath() returns correct file path
  - [x] Test singleton pattern with getCliConfig()
  - [x] Test environment variable name mapping (logLevel -> HOMELAB_LOG_LEVEL)
  - [x] Test boolean parsing from environment variables
- [x] Run tests: `pnpm test`

## Phase 3: Config Read Command

- [x] Create `src/commands/config/read.ts` extending BaseCommand
  - [x] Add static description: "Read configuration values"
  - [x] Add optional [key] argument for reading specific config key
  - [x] Add --path (-p) flag to show config file location
  - [x] Implement async run() method:
    [x] - Parse args and flags
    [x] - Get config instance via getCliConfig()
    [x] - If --path flag, display config file path and exit
    [x] - If key argument provided, display specific key value
    [x] - Otherwise, display all config as formatted JSON
- [x] Write integration tests in `test/commands/config/read.test.ts`
  - [x] Use runCommand from @oclif/test
  - [x] Test reading all config (no arguments)
  - [x] Test reading specific key
  - [x] Test --path flag shows config file location
  - [x] Test environment variable override is reflected in output
  - [x] Verify JSON formatting for all config output
- [x] Run tests: `pnpm test`

## Phase 4: Config Write Command

- [x] Create `src/commands/config/write.ts` extending BaseCommand
  - [x] Add static description: "Write configuration values"
  - [x] Add required <key> argument
  - [x] Add required <value> argument
  - [x] Implement async run() method:
    - Parse args
    - Get config instance via getCliConfig()
    - Parse value with type awareness (detect 'true'/'false' for booleans)
    - Call config.set(key, parsedValue)
    - Display confirmation: "Set {key} = {value}"
    - Display config file path
- [x] Write integration tests in `test/commands/config/write.test.ts`
  - [x] Use runCommand from @oclif/test
  - [x] Test writing string value
  - [x] Test writing boolean value 'true'
  - [x] Test writing boolean value 'false'
  - [x] Test persistence (write then read)
  - [x] Test missing key argument error
  - [x] Test missing value argument error
  - [x] Verify config file path is displayed
- [x] Run tests: `pnpm test`

## Phase 5: Documentation

- [x] Update `CLAUDE.md` with ConfigStore integration section
  - Document CliConfig pattern and usage
  - Document environment variable override behavior (HOMELAB_* prefix)
  - Document precedence: env > configstore > defaults
  - Add examples of using `config read` and `config write` commands
  - Document config file locations by platform
  - Add testing patterns for configstore-backed configs
  - Document singleton pattern for config instances

## Phase 6: Integration & Validation

- [x] Run full build: `pnpm run build`
- [x] Run all tests: `pnpm test`
- [x] Run linter: `pnpm run lint`
- [x] Manual testing:
  - Run `./bin/dev.js config read` - verify shows all config with defaults
  - Run `./bin/dev.js config write logLevel debug` - verify persists
  - Run `./bin/dev.js config read logLevel` - verify shows 'debug'
  - Run `./bin/dev.js config read --path` - verify shows config file location
  - Set `HOMELAB_LOG_LEVEL=error` and run `./bin/dev.js config read logLevel` - verify shows 'error'
  - Unset env var and run `./bin/dev.js config read logLevel` - verify shows 'debug' from configstore
  - Run `./bin/dev.js config write colorOutput false` - verify boolean parsing
  - Run `./bin/dev.js config read` - verify JSON output is formatted
- [x] Update README via oclif: `pnpm run prepack`

## Phase 7: Final Validation

- [x] Ensure all tests pass: `pnpm test`
- [x] Ensure build succeeds: `pnpm run build`
- [x] Ensure linter passes: `pnpm run lint`
- [x] Verify no TypeScript errors: `tsc --noEmit`
- [x] Review code against project conventions
- [x] Verify all scenarios from specs are covered by tests
- [x] Update proposal status to complete

## Validation Criteria

- [x] All unit tests passing (config manager, commands)
- [x] All integration tests passing (read/write commands)
- [x] Build succeeds without errors
- [x] Linter passes without warnings
- [x] Environment variables override configstore values
- [x] Configstore values persist across CLI invocations
- [x] Schema defaults used when no other value exists
- [x] Commands display clear, formatted output
- [x] Config file path is discoverable via --path flag
- [x] Boolean values parsed correctly from strings
- [x] Singleton pattern ensures consistent state
- [x] Code follows layered architecture pattern
- [x] HOMELAB_* environment variable naming convention
- [x] Documentation updated in CLAUDE.md
