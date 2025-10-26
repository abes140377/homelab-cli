<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript CLI application built with [oclif](https://oclif.io), a framework for building command-line tools. The CLI binary is named `homelab` and manages homelab infrastructure.

The project follows a layered architecture pattern:
- **Commands**: Entry points for CLI commands (oclif framework)
- **Services**: Business logic layer
- **Repositories**: Data access layer with interface abstraction
- **Models**: DTOs and Zod schemas for validation
- **Factories**: Entity creation and mapping
- **Config**: Configuration management with environment variables
- **Errors**: Custom error types for different layers

### Key Dependencies

- **oclif**: CLI framework (`@oclif/core`, `@oclif/plugin-help`, `@oclif/plugin-plugins`)
- **proxmox-api**: Proxmox VE API client
- **cli-table3**: Terminal tables for formatted output
- **zod**: Runtime type validation and schema definitions
- **tsx**: Fast TypeScript execution for testing

## Development Commands

### Building
```bash
pnpm run build
```
This removes the `dist/` directory and compiles TypeScript using `tsc -b`.

### Testing
```bash
# Run all tests
pnpm test

# Run a single test file
pnpm exec mocha --forbid-only "test/path/to/file.test.ts"
```
Tests use Mocha with Chai assertions and `@oclif/test` utilities. The `--forbid-only` flag prevents committing focused tests.

### Linting
```bash
pnpm run lint
```
Uses ESLint with oclif and prettier configurations. Runs automatically after tests.

### Running the CLI Locally
```bash
# During development
./bin/dev.js <command>

# After building
./bin/run.js <command>
```

## Architecture

### Project Structure

```
src/
├── commands/         # CLI command implementations
│   ├── proxmox/     # Proxmox-related commands
│   │   └── template/
│   │       └── list.ts
│   └── workspace/   # Workspace management commands
│       └── list.ts
├── config/          # Configuration management
│   ├── schemas/     # Zod schemas for configs
│   └── proxmox.config.ts
├── errors/          # Custom error types
│   ├── base.error.ts
│   ├── repository.error.ts
│   └── service.error.ts
├── factories/       # Entity factories
│   ├── proxmox-template.factory.ts
│   └── workspace.factory.ts
├── models/          # DTOs and schemas
│   ├── schemas/     # Zod validation schemas
│   └── *.dto.ts     # Data Transfer Objects
├── repositories/    # Data access layer
│   ├── interfaces/  # Repository contracts
│   ├── proxmox-api.repository.ts
│   └── workspace.repository.ts
├── services/        # Business logic layer
│   ├── proxmox-template.service.ts
│   └── workspace.service.ts
├── utils/           # Utility functions
│   └── result.ts    # Result type for error handling
└── index.ts         # Entry point

test/
├── commands/        # Command tests
├── config/          # Config tests
├── integration/     # Integration tests
├── repositories/    # Repository tests
└── services/        # Service tests
```

### Command Structure

Commands follow oclif conventions and are organized in `src/commands/`:
- Each command is a TypeScript class extending `Command` from `@oclif/core`
- Commands can be nested using directories (e.g., `proxmox/template/list.ts` creates `homelab proxmox template list`)
- After building, commands are loaded from `dist/commands/`

**Implemented Commands:**
- `homelab workspace list` - Lists all workspaces
- `homelab proxmox template list` - Lists Proxmox VM templates

**Command Anatomy:**
```typescript
import {Args, Command, Flags} from '@oclif/core'

export default class MyCommand extends Command {
  static description = 'Brief description'

  static args = {
    argName: Args.string({description: 'Arg description', required: true}),
  }

  static flags = {
    flagName: Flags.string({char: 'f', description: 'Flag description'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(MyCommand)
    // Implementation
  }
}
```

### Testing Pattern

Tests use `runCommand` from `@oclif/test`:
```typescript
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('command-name', () => {
  it('runs command', async () => {
    const {stdout} = await runCommand('command-name arg --flag value')
    expect(stdout).to.contain('expected output')
  })
})
```

### Build System

- **TypeScript**: Configured for ES2022 with Node16 modules (ESM)
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Output**: Compiled to `dist/` with declaration files
- **Manifest**: Generated via `oclif manifest` during `prepack` to optimize command loading

### Plugin System

The CLI uses oclif's plugin architecture:
- `@oclif/plugin-help`: Automatic help documentation
- `@oclif/plugin-plugins`: Plugin management capabilities

### Layered Architecture Pattern

The project follows a strict layered architecture:

1. **Command Layer** (`src/commands/`): Handles CLI interaction, parsing args/flags
2. **Service Layer** (`src/services/`): Contains business logic, orchestrates repositories
3. **Repository Layer** (`src/repositories/`): Abstracts data access, implements interfaces
4. **Model Layer** (`src/models/`): Defines DTOs with Zod schemas for validation
5. **Factory Layer** (`src/factories/`): Creates and maps domain entities

**Benefits:**
- Clear separation of concerns
- Testability through dependency injection
- Type safety with Zod runtime validation
- Easy to mock repositories for unit testing

### Configuration Management

Configuration is managed through environment variables and validated with Zod schemas.

**Proxmox Configuration** (see `src/config/proxmox.config.ts`):

Required environment variables:
- `PROXMOX_USER`: Proxmox user (e.g., 'root')
- `PROXMOX_REALM`: Authentication realm (e.g., 'pam')
- `PROXMOX_TOKEN_KEY`: Token identifier (e.g., 'homelabcli')
- `PROXMOX_TOKEN_SECRET`: Token secret (UUID format)
- `PROXMOX_HOST`: Hostname without protocol (e.g., 'proxmox.home.sflab.io')

Optional environment variables:
- `PROXMOX_PORT`: Port number (defaults to 8006)
- `PROXMOX_REJECT_UNAUTHORIZED`: Verify SSL certificates (defaults to true, set to 'false' for self-signed certs)

**Loading Configuration:**
```typescript
import {loadProxmoxConfig} from './config/proxmox.config.js'

const config = loadProxmoxConfig() // Throws if validation fails
```

## Key Patterns

### Adding a New Command

When adding a new command, follow the layered architecture:

1. **Define the Model** (`src/models/`):
   ```typescript
   // src/models/my-entity.dto.ts
   export class MyEntityDto {
     constructor(
       public readonly id: string,
       public readonly name: string,
     ) {}
   }
   ```

2. **Create Zod Schema** (`src/models/schemas/`):
   ```typescript
   // src/models/schemas/my-entity.schema.ts
   import {z} from 'zod'

   export const MyEntitySchema = z.object({
     id: z.string().uuid(),
     name: z.string().min(1),
   })
   ```

3. **Create Factory** (`src/factories/`):
   ```typescript
   // src/factories/my-entity.factory.ts
   import {MyEntityDto} from '../models/my-entity.dto.js'
   import {MyEntitySchema} from '../models/schemas/my-entity.schema.js'

   export class MyEntityFactory {
     static fromApiResponse(raw: unknown): MyEntityDto {
       const validated = MyEntitySchema.parse(raw)
       return new MyEntityDto(validated.id, validated.name)
     }
   }
   ```

4. **Define Repository Interface** (`src/repositories/interfaces/`):
   ```typescript
   // src/repositories/interfaces/my-entity.repository.interface.ts
   import type {Result} from '../../utils/result.js'
   import type {MyEntityDto} from '../../models/my-entity.dto.js'

   export interface IMyEntityRepository {
     findAll(): Promise<Result<MyEntityDto[]>>
   }
   ```

5. **Implement Repository** (`src/repositories/`):
   ```typescript
   // src/repositories/my-entity.repository.ts
   import type {IMyEntityRepository} from './interfaces/my-entity.repository.interface.js'

   export class MyEntityRepository implements IMyEntityRepository {
     async findAll(): Promise<Result<MyEntityDto[]>> {
       // Implementation
     }
   }
   ```

6. **Create Service** (`src/services/`):
   ```typescript
   // src/services/my-entity.service.ts
   import type {IMyEntityRepository} from '../repositories/interfaces/my-entity.repository.interface.js'

   export class MyEntityService {
     constructor(private repository: IMyEntityRepository) {}

     async list(): Promise<Result<MyEntityDto[]>> {
       return this.repository.findAll()
     }
   }
   ```

7. **Create Command** (`src/commands/`):
   ```typescript
   // src/commands/myentity/list.ts
   import {Command} from '@oclif/core'
   import Table from 'cli-table3'
   import {MyEntityRepository} from '../../repositories/my-entity.repository.js'
   import {MyEntityService} from '../../services/my-entity.service.js'

   export default class MyEntityList extends Command {
     static description = 'List all my entities'

     async run(): Promise<void> {
       const repository = new MyEntityRepository()
       const service = new MyEntityService(repository)
       const result = await service.list()

       if (!result.success) {
         this.error(result.error.message)
       }

       const table = new Table({head: ['ID', 'Name']})
       for (const entity of result.data) {
         table.push([entity.id, entity.name])
       }
       this.log(table.toString())
     }
   }
   ```

8. **Add Tests** for each layer:
   - `test/repositories/my-entity.repository.test.ts`
   - `test/services/my-entity.service.test.ts`
   - `test/commands/myentity/list.test.ts`

9. Build and test: `pnpm run build && pnpm test`

10. Update README: `pnpm run prepack`

### Error Handling Pattern

The project uses a `Result<T>` type for error handling instead of throwing exceptions:

```typescript
// src/utils/result.ts
export type Result<T> =
  | {success: true; data: T}
  | {success: false; error: Error}

// Usage in services/repositories
async findAll(): Promise<Result<MyEntityDto[]>> {
  try {
    const data = await this.apiCall()
    return {success: true, data}
  } catch (error) {
    return {success: false, error: new RepositoryError('Failed to fetch')}
  }
}

// Usage in commands
const result = await service.list()
if (!result.success) {
  this.error(result.error.message) // oclif's error method
}
// Use result.data safely here
```

**Custom Error Types:**
- `BaseError` - Base error class
- `RepositoryError` - Data access errors
- `ServiceError` - Business logic errors

### Updating README

The README is auto-generated from oclif manifest:
```bash
pnpm run prepack  # Generates manifest and updates README
```
This happens automatically during `pnpm pack` or version bumps.

## OpenSpec Integration

This project uses OpenSpec for managing changes and proposals. OpenSpec is a framework for systematic change management.

**Key OpenSpec Commands:**
- `/openspec:proposal` - Create a new change proposal
- `/openspec:apply` - Implement an approved change
- `/openspec:archive` - Archive a deployed change

**OpenSpec Structure:**
- `openspec/AGENTS.md` - Instructions for AI assistants
- `openspec/project.md` - Project-level specs
- `openspec/changes/` - Individual change proposals with specs and tasks

When making significant changes (new features, architecture changes, breaking changes), consult `openspec/AGENTS.md` first.

## Important Files

- `package.json`: Contains oclif configuration in the `oclif` section
- `src/index.ts`: Entry point that exports oclif's `run` function
- `bin/run.js`: Production CLI entry point
- `bin/dev.js`: Development CLI entry point with tsx/ts-node support
- `tsconfig.json`: TypeScript configuration for Node16 modules
- `test/tsconfig.json`: Test-specific TypeScript configuration

## Environment Setup

Create a `.env` file or set environment variables for Proxmox integration:

```bash
# Required
PROXMOX_USER=root
PROXMOX_REALM=pam
PROXMOX_TOKEN_KEY=homelabcli
PROXMOX_TOKEN_SECRET=your-token-secret-uuid
PROXMOX_HOST=proxmox.home.sflab.io

# Optional
PROXMOX_PORT=8006
PROXMOX_REJECT_UNAUTHORIZED=false  # Set to false for self-signed certificates
```

## Requirements

- Node.js >= 18.0.0
- pnpm package manager

## Testing

Tests are organized by layer:
- **Unit tests**: Test individual components in isolation
- **Integration tests**: Test interaction with external services (e.g., Proxmox API)

Test execution uses `tsx` for fast TypeScript execution:
```bash
# All tests
pnpm test

# Single test file
pnpm exec mocha --forbid-only "test/path/to/file.test.ts"

# Integration tests (may require environment setup)
pnpm exec mocha --forbid-only "test/integration/**/*.test.ts"
```

**Test Patterns:**
- Use `@oclif/test` utilities for command testing
- Mock repositories in service tests using interfaces
- Use factories to create test data
- Integration tests may require actual Proxmox credentials
