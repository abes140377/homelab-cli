# Project Listing Command

## Why

Users need to list and view their projects within workspaces. Projects are a new entity representing code repositories associated with workspaces. Currently, there is no way to view which projects belong to a workspace through the CLI.

## What Changes

- Add new `project` entity with name, description, gitRepoUrl, id, createdAt, and updatedAt fields
- Implement `homelab project list` command to list all projects for the current workspace (determined by current directory basename)
- Implement `homelab project list <workspace-name>` command to list projects for a specific workspace
- Follow existing layered architecture pattern (Command → Service → Repository → PocketBase)
- Use PocketBase collection `projects` with a `workspace` relation field to the `workspaces` collection
- Output tabular format with columns: name, description, gitRepoUrl

## Impact

- **Affected specs**: Creates new `project-management` capability spec
- **Affected code**:
  - New files: `src/models/project.dto.ts`, `src/models/schemas/project.schema.ts`
  - New files: `src/repositories/project.repository.ts`, `src/repositories/interfaces/project.repository.interface.ts`
  - New files: `src/services/project.service.ts`
  - New files: `src/factories/project.factory.ts`
  - New files: `src/commands/project/list.ts`
  - New tests: `test/models/schemas/project.schema.test.ts`, `test/repositories/project.repository.test.ts`, `test/services/project.service.test.ts`, `test/commands/project/list.test.ts`
- **PocketBase dependency**: Requires `projects` collection with `workspace` relation field
- **Environment variables**: Reuses existing `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`
