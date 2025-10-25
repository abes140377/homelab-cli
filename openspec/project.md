# Project Context

## Purpose
`homelab-cli` is a TypeScript-based command-line interface (CLI) application for managing homelab infrastructure. Built on the oclif framework, it provides a structured, extensible toolset for homelab operations. The binary is invoked as `homelab`.

## Tech Stack
- **Language**: TypeScript 5.x (ES2022 target, Node16 module system)
- **CLI Framework**: oclif v4 (provides command structure, plugin system, help generation)
- **Runtime**: Node.js >= 18.0.0
- **Package Manager**: pnpm
- **Testing**: Mocha + Chai + @oclif/test utilities
- **Linting**: ESLint with oclif and prettier configurations
- **Module System**: ES modules (`"type": "module"` in package.json)

## Project Conventions

### Code Style
- **Module Format**: ES modules (ESM) with `.js` extensions in import paths after compilation
- **TypeScript**: Strict mode enabled, declaration files generated
- **Formatting**: Uses `@oclif/prettier-config` (run via ESLint post-test)
- **Naming**:
  - Commands: kebab-case in directories (e.g., `hello/world.ts` → `homelab hello world`)
  - Classes: PascalCase extending oclif's `Command` base class
  - Files: kebab-case for commands, camelCase for utilities

### Architecture Patterns
- **Command Pattern**: Each command is a class in `src/commands/` extending oclif's `Command`
- **Command Structure**:
  - Static properties define args, flags, description, examples
  - `async run()` method contains implementation
  - Uses `this.parse()` to extract args/flags
  - Uses `this.log()` for output (never console.log)
- **Plugin Architecture**: Extensible via oclif plugins (@oclif/plugin-help, @oclif/plugin-plugins)
- **Build Artifacts**: Source in `src/`, compiled to `dist/`, manifest generated via `oclif manifest`
- **Entry Points**:
  - Development: `bin/dev.js` (uses ts-node with ESM support)
  - Production: `bin/run.js` (uses compiled dist/)

### Testing Strategy
- **Framework**: Mocha with `--forbid-only` to prevent focused tests in commits
- **Assertions**: Chai expect-style
- **Test Utilities**: `@oclif/test` provides `runCommand()` helper
- **Test Location**: Mirror structure in `test/commands/` matching `src/commands/`
- **Coverage**: Every command MUST have a corresponding test
- **Test Execution**: `pnpm test` runs all tests, followed by automatic linting
- **Single Test**: `pnpm exec mocha --forbid-only "test/path/to/file.test.ts"`
- **Philosophy**: Test behavior, not implementation; clear test names describing scenario

### Git Workflow
- **Main Branch**: `main` (used for PRs)
- **Commit Style**: Clear messages explaining "why" over "what" using a conventional commits style
- **Pre-commit**: Hooks may run formatters/linters
- **README Updates**: Auto-generated via `oclif readme` during `prepack` (don't edit manually)
- **Versioning**: `pnpm version` automatically updates README and stages changes

## Domain Context
Homelab infrastructure management involves:
- Server/service orchestration
- Configuration management
- Network management
- Container/VM lifecycle management on Proxmox, Docker, Kubernetes

The CLI should provide:
- Idempotent operations where possible
- Clear error messages with actionable guidance
- Structured output suitable for scripting (consider --json flags)
- Safe defaults with explicit flags for destructive operations

## Important Constraints
- **Node Version**: Must support Node >= 18.0.0
- **ES Modules**: All code uses ESM (no CommonJS)
- **Compilation Required**: Code must be built before distribution (TypeScript → JavaScript)
- **Manifest Generation**: `oclif manifest` must run during packaging for optimal command loading
- **Testing Gate**: All tests must pass before commits; never use `--no-verify`
- **No Focused Tests**: `--forbid-only` prevents `.only()` in tests from being committed

## External Dependencies

### Core Dependencies
- `@oclif/core`: CLI framework providing command structure, parsing, help system
- `@oclif/plugin-help`: Automatic help documentation generation
- `@oclif/plugin-plugins`: Plugin management capabilities

### Development Dependencies
- `oclif`: CLI for generating manifests and README
- `shx`: Cross-platform shell commands (used in build scripts)
- `ts-node`: TypeScript execution for development mode

### Infrastructure
- **Repository**: https://github.com/abes140377/homelab-cli
- **Issues**: https://github.com/abes140377/homelab-cli/issues
- **License**: MIT
- **Distribution**: Published as npm package with bin command `homelab`
