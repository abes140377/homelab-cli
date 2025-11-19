# Proposal: Integrate ConfigStore for Persistent Configuration Management

## Status
**Draft** - Awaiting review and approval

## Context
Currently, homelab-cli relies exclusively on environment variables for configuration management (e.g., `PROXMOX_*`, `PROJECTS_DIR`). While this approach works, it has several drawbacks:

1. **User friction**: Users must manage environment variables manually via `.env` files or shell configuration
2. **No persistence**: Configuration isn't stored persistently in a user-friendly way
3. **Repetitive setup**: Users must re-configure settings across different environments
4. **No discoverability**: Users can't easily view or modify current configuration without consulting documentation

Other CLI tools (e.g., `npm`, `git`, `gh`) provide persistent configuration that can be set once and used across sessions.

## Proposal
Integrate the `configstore` npm package to provide persistent configuration management with the following characteristics:

- **Persistent storage**: Configuration values stored in user-specific config files managed by configstore
- **Environment variable overrides**: Existing environment variables take precedence for flexibility
- **CLI commands**: New `homelab config read` and `homelab config write` commands for managing configuration
- **Backward compatibility**: Existing environment variable-based workflows continue to work
- **Proof of concept**: Initial implementation via new `CliConfig` class demonstrating the pattern

## Goals
1. **Improve UX**: Enable users to configure the CLI once and have settings persist
2. **Demonstrate pattern**: Create a proof-of-concept with `CliConfig` class that can later be applied to existing config classes
3. **Maintain flexibility**: Preserve environment variable overrides for CI/CD and advanced use cases
4. **Enable discovery**: Provide commands to view and modify configuration interactively

## Non-Goals (for this change)
1. **Migrate existing configs**: This is a proof-of-concept; existing `ProxmoxConfig` and `ProjectsDirConfig` will be migrated in follow-up work
2. **Configuration validation UI**: Advanced validation and error handling in commands is out of scope
3. **Configuration migration**: No automatic migration from environment variables to configstore
4. **Configuration encryption**: Sensitive values (like secrets) are stored in plaintext for this PoC

## Scope
This change introduces:

1. **New dependency**: Add `configstore` and `@types/configstore` packages
2. **New config class**: `CliConfig` in `src/config/cli.config.ts` demonstrating the pattern
3. **New commands**:
   - `homelab config read [key]` - Read configuration values
   - `homelab config write <key> <value>` - Write configuration values
4. **Architecture documentation**: Update `CLAUDE.md` with configstore patterns

## Capabilities Introduced
1. **persistent-config-management**: Core functionality for storing and retrieving configuration with configstore
2. **config-commands**: CLI commands for reading and writing configuration values

## Dependencies
- No dependencies on other in-flight changes
- Builds on existing configuration patterns in `src/config/`

## Success Criteria
- [ ] `configstore` package integrated into project
- [ ] `CliConfig` class created with configstore backend
- [ ] Environment variables override configstore values
- [ ] `homelab config read` command displays configuration
- [ ] `homelab config write` command persists configuration
- [ ] Tests validate configstore integration and env var overrides
- [ ] Documentation updated in `CLAUDE.md`

## Risks & Mitigations
**Risk**: Configstore may store sensitive values in plaintext
**Mitigation**: Document this limitation; consider encryption in future work; recommend environment variables for secrets

**Risk**: Users may be confused about precedence (env vars vs. configstore)
**Mitigation**: Clear documentation and helpful error messages explaining the precedence

**Risk**: Configstore file location may not be obvious
**Mitigation**: `config read` command can show the config file path

## Future Work
1. Migrate `ProxmoxConfig` to use configstore backend
2. Migrate `ProjectsDirConfig` to use configstore backend
3. Add `homelab config reset` command to clear all configuration
4. Add `homelab config path` command to display config file location
5. Add encryption for sensitive values in configstore
6. Interactive prompts for `config write` when value not provided
