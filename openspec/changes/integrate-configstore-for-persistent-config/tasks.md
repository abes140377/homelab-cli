# Implementation Tasks: ConfigStore Integration

## Prerequisites

- [ ] Install configstore dependency: `pnpm add configstore`
- [ ] Install @types/configstore dev dependency: `pnpm add -D @types/configstore`

## Phase 1: Configuration Schema

- [ ] Create `src/models/schemas/cli-config.schema.ts` with Zod schema for CliConfig
  - [ ] Define logLevel enum: ['debug', 'info', 'warn', 'error'] with default 'info'
  - [ ] Define colorOutput boolean with default true
  - [ ] Export CliConfigSchema and infer CliConfig type
- [ ] Verify schema compiles: `pnpm run build`

## Phase 2: Configuration Manager

- [ ] Create `src/config/cli.config.ts` with CliConfigManager class
  - [ ] Implement constructor creating Configstore instance with package name 'homelab-cli'
  - [ ] Implement get() method with precedence: environment variable > configstore > schema default
  - [ ] Implement set() method to persist values to configstore
  - [ ] Implement getAll() method returning all config values with precedence applied
  - [ ] Implement getPath() method returning config file path
  - [ ] Implement private getFromEnv() helper for environment variable parsing
  - [ ] Implement private getDefault() helper for schema default values
  - [ ] Export singleton getCliConfig() function
- [ ] Write unit tests in `test/config/cli.config.test.ts`
  - [ ] Test get() with environment variable override (highest priority)
  - [ ] Test get() from configstore (middle priority)
  - [ ] Test get() with schema defaults (lowest priority)
  - [ ] Test set() persists to configstore
  - [ ] Test getAll() returns all config with precedence
  - [ ] Test getPath() returns correct file path
  - [ ] Test singleton pattern with getCliConfig()
  - [ ] Test environment variable name mapping (logLevel -> HOMELAB_LOG_LEVEL)
  - [ ] Test boolean parsing from environment variables
- [ ] Run tests: `pnpm test`

## Phase 3: Config Read Command

- [ ] Create `src/commands/config/read.ts` extending BaseCommand
  - [ ] Add static description: "Read configuration values"
  - [ ] Add optional [key] argument for reading specific config key
  - [ ] Add --path (-p) flag to show config file location
  - [ ] Implement async run() method:
    [ ] - Parse args and flags
    [ ] - Get config instance via getCliConfig()
    [ ] - If --path flag, display config file path and exit
    [ ] - If key argument provided, display specific key value
    [ ] - Otherwise, display all config as formatted JSON
- [ ] Write integration tests in `test/commands/config/read.test.ts`
  - [ ] Use runCommand from @oclif/test
  - [ ] Test reading all config (no arguments)
  - [ ] Test reading specific key
  - [ ] Test --path flag shows config file location
  - [ ] Test environment variable override is reflected in output
  - [ ] Verify JSON formatting for all config output
- [ ] Run tests: `pnpm test`

## Phase 4: Config Write Command

- [ ] Create `src/commands/config/write.ts` extending BaseCommand
  - [ ] Add static description: "Write configuration values"
  - [ ] Add required <key> argument
  - [ ] Add required <value> argument
  - [ ] Implement async run() method:
    - Parse args
    - Get config instance via getCliConfig()
    - Parse value with type awareness (detect 'true'/'false' for booleans)
    - Call config.set(key, parsedValue)
    - Display confirmation: "Set {key} = {value}"
    - Display config file path
- [ ] Write integration tests in `test/commands/config/write.test.ts`
  - [ ] Use runCommand from @oclif/test
  - [ ] Test writing string value
  - [ ] Test writing boolean value 'true'
  - [ ] Test writing boolean value 'false'
  - [ ] Test persistence (write then read)
  - [ ] Test missing key argument error
  - [ ] Test missing value argument error
  - [ ] Verify config file path is displayed
- [ ] Run tests: `pnpm test`

## Phase 5: Documentation

- [ ] Update `CLAUDE.md` with ConfigStore integration section
  - Document CliConfig pattern and usage
  - Document environment variable override behavior (HOMELAB_* prefix)
  - Document precedence: env > configstore > defaults
  - Add examples of using `config read` and `config write` commands
  - Document config file locations by platform
  - Add testing patterns for configstore-backed configs
  - Document singleton pattern for config instances

## Phase 6: Integration & Validation

- [ ] Run full build: `pnpm run build`
- [ ] Run all tests: `pnpm test`
- [ ] Run linter: `pnpm run lint`
- [ ] Manual testing:
  - Run `./bin/dev.js config read` - verify shows all config with defaults
  - Run `./bin/dev.js config write logLevel debug` - verify persists
  - Run `./bin/dev.js config read logLevel` - verify shows 'debug'
  - Run `./bin/dev.js config read --path` - verify shows config file location
  - Set `HOMELAB_LOG_LEVEL=error` and run `./bin/dev.js config read logLevel` - verify shows 'error'
  - Unset env var and run `./bin/dev.js config read logLevel` - verify shows 'debug' from configstore
  - Run `./bin/dev.js config write colorOutput false` - verify boolean parsing
  - Run `./bin/dev.js config read` - verify JSON output is formatted
- [ ] Update README via oclif: `pnpm run prepack`

## Phase 7: Final Validation

- [ ] Ensure all tests pass: `pnpm test`
- [ ] Ensure build succeeds: `pnpm run build`
- [ ] Ensure linter passes: `pnpm run lint`
- [ ] Verify no TypeScript errors: `tsc --noEmit`
- [ ] Review code against project conventions
- [ ] Verify all scenarios from specs are covered by tests
- [ ] Update proposal status to complete

## Validation Criteria

- [ ] All unit tests passing (config manager, commands)
- [ ] All integration tests passing (read/write commands)
- [ ] Build succeeds without errors
- [ ] Linter passes without warnings
- [ ] Environment variables override configstore values
- [ ] Configstore values persist across CLI invocations
- [ ] Schema defaults used when no other value exists
- [ ] Commands display clear, formatted output
- [ ] Config file path is discoverable via --path flag
- [ ] Boolean values parsed correctly from strings
- [ ] Singleton pattern ensures consistent state
- [ ] Code follows layered architecture pattern
- [ ] HOMELAB_* environment variable naming convention
- [ ] Documentation updated in CLAUDE.md
