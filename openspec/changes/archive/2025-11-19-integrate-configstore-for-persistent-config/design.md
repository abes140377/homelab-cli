# Design: ConfigStore Integration

## Overview
This design describes how the `configstore` npm package will be integrated into homelab-cli to provide persistent configuration management while maintaining backward compatibility with environment variables.

## Architecture

### Layered Configuration Strategy
Configuration will follow a precedence hierarchy:

1. **Environment variables** (highest priority) - for CI/CD and overrides
2. **Configstore** (fallback) - persistent user configuration
3. **Defaults** (lowest priority) - hardcoded sensible defaults

This ensures existing workflows continue to work while providing a better UX for local development.

### Configuration Class Pattern

The `CliConfig` class will demonstrate a reusable pattern:

```typescript
// src/config/cli.config.ts
import Configstore from 'configstore'
import {z} from 'zod'

const CliConfigSchema = z.object({
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  colorOutput: z.boolean().default(true),
})

type CliConfig = z.infer<typeof CliConfigSchema>

export class CliConfigManager {
  private store: Configstore

  constructor(packageName: string = 'homelab-cli') {
    this.store = new Configstore(packageName, {})
  }

  /**
   * Get a configuration value with environment variable override
   */
  get<K extends keyof CliConfig>(key: K): CliConfig[K] {
    // 1. Check environment variable first
    const envValue = this.getFromEnv(key)
    if (envValue !== undefined) {
      return envValue
    }

    // 2. Check configstore
    const storeValue = this.store.get(key)
    if (storeValue !== undefined) {
      return storeValue
    }

    // 3. Return default from schema
    return this.getDefault(key)
  }

  /**
   * Set a configuration value in configstore
   */
  set<K extends keyof CliConfig>(key: K, value: CliConfig[K]): void {
    this.store.set(key, value)
  }

  /**
   * Get all configuration values
   */
  getAll(): CliConfig {
    const config = {} as CliConfig
    const keys: (keyof CliConfig)[] = ['logLevel', 'colorOutput']

    for (const key of keys) {
      config[key] = this.get(key)
    }

    return config
  }

  /**
   * Get the path to the config file
   */
  getPath(): string {
    return this.store.path
  }

  private getFromEnv<K extends keyof CliConfig>(key: K): CliConfig[K] | undefined {
    const envKey = `HOMELAB_${key.toUpperCase()}`
    const envValue = process.env[envKey]

    if (!envValue) {
      return undefined
    }

    // Type-specific parsing (demo for PoC)
    if (key === 'colorOutput') {
      return (envValue.toLowerCase() === 'true') as CliConfig[K]
    }

    return envValue as CliConfig[K]
  }

  private getDefault<K extends keyof CliConfig>(key: K): CliConfig[K] {
    const defaults = CliConfigSchema.parse({})
    return defaults[key]
  }
}

// Singleton instance
let instance: CliConfigManager | null = null

export function getCliConfig(): CliConfigManager {
  if (!instance) {
    instance = new CliConfigManager()
  }
  return instance
}
```

### Command Integration

#### Read Command
```typescript
// src/commands/config/read.ts
import {Args, Flags} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {getCliConfig} from '../../config/cli.config.js'

export default class ConfigRead extends BaseCommand<typeof ConfigRead> {
  static description = 'Read configuration values'

  static args = {
    key: Args.string({
      description: 'Configuration key to read',
      required: false,
    }),
  }

  static flags = {
    path: Flags.boolean({
      char: 'p',
      description: 'Show path to config file',
      default: false,
    }),
  }

  async run(): Promise<void> {
    await this.parse(ConfigRead)
    const config = getCliConfig()

    if (this.flags.path) {
      this.log(`Config file: ${config.getPath()}`)
      return
    }

    if (this.args.key) {
      // Read specific key
      const value = config.get(this.args.key as any)
      this.log(`${this.args.key}: ${value}`)
    } else {
      // Read all config
      const allConfig = config.getAll()
      this.log(JSON.stringify(allConfig, null, 2))
    }
  }
}
```

#### Write Command
```typescript
// src/commands/config/write.ts
import {Args} from '@oclif/core'
import {BaseCommand} from '../../lib/base-command.js'
import {getCliConfig} from '../../config/cli.config.js'

export default class ConfigWrite extends BaseCommand<typeof ConfigWrite> {
  static description = 'Write configuration values'

  static args = {
    key: Args.string({
      description: 'Configuration key to set',
      required: true,
    }),
    value: Args.string({
      description: 'Configuration value',
      required: true,
    }),
  }

  async run(): Promise<void> {
    await this.parse(ConfigWrite)
    const config = getCliConfig()

    // Type-aware parsing (basic for PoC)
    let parsedValue: any = this.args.value
    if (this.args.value === 'true' || this.args.value === 'false') {
      parsedValue = this.args.value === 'true'
    }

    config.set(this.args.key as any, parsedValue)
    this.log(`Set ${this.args.key} = ${parsedValue}`)
    this.log(`Config file: ${config.getPath()}`)
  }
}
```

## Design Decisions

### Why Configstore?
- **Mature**: Used by major CLIs (Yeoman, npm packages)
- **Simple API**: Get/set/has/delete methods
- **Cross-platform**: Handles config file location across OS
- **Lightweight**: Minimal dependencies
- **XDG compliant**: Follows XDG Base Directory specification on Linux

### Why Not Alternatives?
- **conf**: More features but heavier; overkill for this use case
- **lowdb**: File-based JSON database; more than we need
- **Custom implementation**: Reinventing the wheel; configstore is battle-tested

### Environment Variable Naming
For the PoC, environment variables will use `HOMELAB_` prefix to avoid conflicts:
- `HOMELAB_LOG_LEVEL`
- `HOMELAB_COLOR_OUTPUT`

Future work migrating existing configs will maintain their current prefixes (`PROXMOX_*`, `PROJECTS_DIR`).

### Singleton Pattern
The `getCliConfig()` function returns a singleton instance to ensure:
- Single source of truth during execution
- Efficient (no repeated file reads)
- Consistent state across commands

### Validation Strategy
- Zod schemas validate structure and types
- Environment variable parsing is type-aware (e.g., "true" → boolean)
- Invalid values logged with helpful error messages

### File Location
Configstore automatically determines the config file location:
- **Linux**: `~/.config/homelab-cli/config.json`
- **macOS**: `~/Library/Preferences/homelab-cli/config.json`
- **Windows**: `%APPDATA%\homelab-cli\config.json`

The `--path` flag in `config read` allows users to discover this location.

## Testing Strategy

### Unit Tests
1. **CliConfigManager tests** (`test/config/cli.config.test.ts`):
   - Test get() with env override
   - Test get() from configstore
   - Test get() with defaults
   - Test set() persistence
   - Test getAll()

2. **Mock Configstore**: Use in-memory implementation for isolated tests

### Integration Tests
1. **ConfigRead command** (`test/commands/config/read.test.ts`):
   - Test reading all config
   - Test reading specific key
   - Test --path flag

2. **ConfigWrite command** (`test/commands/config/write.test.ts`):
   - Test writing string value
   - Test writing boolean value
   - Test file persistence

## Migration Path (Future Work)

This PoC establishes the pattern for migrating existing configs:

1. **ProxmoxConfig migration**:
   - Add configstore backend to `loadProxmoxConfig()`
   - Maintain `PROXMOX_*` env var precedence
   - Add validation for configstore values

2. **ProjectsDirConfig migration**:
   - Add configstore backend to `loadProjectsDirConfig()`
   - Maintain `PROJECTS_DIR` env var precedence

3. **Unified config commands**:
   - Extend `config read/write` to support namespaced keys (e.g., `proxmox.host`)

## Documentation Updates

`CLAUDE.md` will be updated with:
1. ConfigStore integration pattern
2. Environment variable override behavior
3. Examples of using `config read/write` commands
4. Testing patterns for configstore-backed configs

## Trade-offs

### Pros
- **Better UX**: Users configure once, not per shell session
- **Discovery**: Users can view and modify config via CLI
- **Cross-platform**: Works consistently across operating systems
- **Flexible**: Environment variables still work for power users

### Cons
- **New dependency**: Adds `configstore` to dependencies
- **State management**: Config stored outside repository (can be confusing)
- **Security**: Sensitive values stored in plaintext (documented limitation)
- **Testing complexity**: Need to mock file system or use in-memory store

## Open Questions
None - this is a straightforward proof-of-concept demonstrating a pattern.

## Alternatives Considered

### Alternative 1: Configuration via .homelabrc file
**Rejected**: Would require custom parsing logic; configstore handles this

### Alternative 2: Store config in project directory
**Rejected**: Config is user-specific, not project-specific; should be in user home

### Alternative 3: Use dotenv for persistent config
**Rejected**: Dotenv is for environment variables, not a config store; would blur the lines
