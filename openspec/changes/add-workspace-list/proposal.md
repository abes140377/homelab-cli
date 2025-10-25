# Add Workspace List Command

## Why

Homelab infrastructure management requires organizing resources into workspaces. Users need to view all available workspaces to understand their infrastructure organization and select the appropriate context for operations.

## What Changes

- Add `workspace-management` capability with workspace listing functionality
- Implement `homelab workspace list` command
- Create workspace domain model with id, name, createdAt, updatedAt attributes
- Implement layered architecture: Command → Service → Repository with mock data
- Use Result pattern for error handling and Zod schemas for validation
- Repository provides in-memory mock data for initial development

## Impact

- Affected specs: New capability `workspace-management`
- Affected code:
  - New: `src/commands/workspace/list.ts` (CLI layer)
  - New: `src/services/workspace.service.ts` (business logic)
  - New: `src/repositories/workspace.repository.ts` (data access with mock data)
  - New: `src/repositories/interfaces/workspace.repository.interface.ts` (repository contract)
  - New: `src/models/schemas/workspace.schema.ts` (Zod schemas)
  - New: `src/models/workspace.dto.ts` (domain models)
  - New: `src/factories/workspace.factory.ts` (dependency wiring)
  - New: `test/commands/workspace/list.test.ts` (integration tests)
  - New: `test/services/workspace.service.test.ts` (unit tests)
  - New: `test/repositories/workspace.repository.test.ts` (unit tests)
