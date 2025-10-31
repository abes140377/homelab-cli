# Integrate PocketBase Workspaces Listing into CLI

## Why

The current workspace list command uses mock in-memory data. To enable real workspace management backed by persistent storage, we need to integrate with PocketBase - a backend-as-a-service platform that provides a RESTful API for collections. The 'workspaces' collection already exists in PocketBase and needs to be queried from the CLI.

## What Changes

- Add PocketBase JavaScript SDK as a dependency (`pnpm add pocketbase`)
- Create PocketBase configuration management with environment variables
- Implement `PocketBaseWorkspaceRepository` that fetches from PocketBase 'workspaces' collection
- Add `homelab workspace list-pocketbase` command that uses PocketBase repository
- Follow existing layered architecture patterns (Command → Service → Repository)
- Use Result pattern and Zod validation for PocketBase API responses
- Add comprehensive tests for PocketBase integration

## Impact

- Affected specs: New capability `pocketbase-workspace-listing`
- Affected code:
  - Modified: `package.json` (add pocketbase dependency)
  - New: `src/config/pocketbase.config.ts` (configuration loader)
  - New: `src/config/schemas/pocketbase-config.schema.ts` (Zod schema)
  - New: `src/repositories/pocketbase-workspace.repository.ts` (PocketBase data access)
  - New: `src/factories/pocketbase-workspace.factory.ts` (dependency wiring)
  - New: `src/commands/workspace/list-pocketbase.ts` (CLI command)
  - New: `test/config/pocketbase.config.test.ts` (config tests)
  - New: `test/repositories/pocketbase-workspace.repository.test.ts` (repository tests)
  - New: `test/integration/pocketbase-workspace.integration.test.ts` (integration tests)
  - New: `test/commands/workspace/list-pocketbase.test.ts` (command tests)
- Environment variables:
  - `POCKETBASE_URL`: PocketBase instance URL (required)
  - `POCKETBASE_ADMIN_EMAIL`: Admin email for authentication (optional)
  - `POCKETBASE_ADMIN_PASSWORD`: Admin password for authentication (optional)

## Dependencies

This change has no dependencies on other OpenSpec changes and can be implemented independently.

## Success Criteria

- PocketBase SDK is successfully installed and imported
- `homelab workspace list-pocketbase` command fetches and displays workspaces from PocketBase
- Configuration validation works correctly with environment variables
- Error handling provides clear messages for connection/authentication failures
- All tests pass (unit, integration, command)
- Documentation is updated automatically via `pnpm run prepack`
