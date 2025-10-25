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

### Command Structure

Commands follow oclif conventions and are organized in `src/commands/`:
- Each command is a TypeScript class extending `Command` from `@oclif/core`
- Commands can be nested using directories (e.g., `hello/world.ts` creates `homelab hello world`)
- After building, commands are loaded from `dist/commands/`

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

## Key Patterns

### Adding a New Command

1. Create file in `src/commands/` (e.g., `src/commands/mycommand.ts`)
2. Export a class extending `Command` with static properties for args, flags, description
3. Implement the `async run()` method
4. Add corresponding test in `test/commands/mycommand.test.ts`
5. Build and test: `pnpm run build && pnpm test`

### Updating README

The README is auto-generated from oclif manifest:
```bash
pnpm run prepack  # Generates manifest and updates README
```
This happens automatically during `pnpm pack` or version bumps.

## Important Files

- `package.json`: Contains oclif configuration in the `oclif` section
- `src/index.ts`: Entry point that exports oclif's `run` function
- `bin/run.js`: Production CLI entry point
- `bin/dev.js`: Development CLI entry point with ts-node support
- `tsconfig.json`: TypeScript configuration for Node16 modules

## Requirements

- Node.js >= 18.0.0
- pnpm package manager
