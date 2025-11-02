# Add Project Module Listing Command

## Why

Users need a way to discover and view modules within a project. A module is a git repository under a project's `src/` directory. This command enables users to list all modules for a given project (or the current project) from the filesystem, following the same pattern established by the `project list` command.

## What Changes

- Add `homelab project module list [project-name]` command to list modules for a project
- Create new module domain model (ModuleFsDto) with Zod schema validation
- Implement ModuleFsRepository to scan `~/projects/<project-name>/src/` for git repositories
- Create ModuleFsService to orchestrate module listing logic
- Support optional project-name argument: when omitted, detect current project from working directory
- Display module information in tabular format (name, git repository URL)
- Follow established layered architecture pattern (Command → Service → Repository)

## Impact

- **Affected specs**: Creates new capability `project-module-listing`
- **Affected code**:
  - New files: `src/commands/project/module/list.ts`
  - New files: `src/models/module-fs.dto.ts`, `src/models/schemas/module-fs.schema.ts`
  - New files: `src/repositories/module-fs.repository.ts`, `src/repositories/interfaces/module-fs.repository.interface.ts`
  - New files: `src/services/module-fs.service.ts`
  - Modified: `src/factories/project.factory.ts` (or new `src/factories/module.factory.ts`)
- **Dependencies**: Reuses existing dependencies (oclif, cli-table3, zod, node fs/path)
- **User impact**: New command available in CLI
