# Proposal: Migrate to Proxmox API Package

## Change ID
`migrate-to-proxmox-api-package`

## Status
Proposed

## Summary
Replace the custom fetch-based Proxmox repository implementation (`ProxmoxRepository`) with the npm package-based implementation (`ProxmoxApiRepository`) that uses the `proxmox-api` package. Remove the old repository and its tests.

## Motivation

### Current State
The project currently has two Proxmox repository implementations:
1. **ProxmoxRepository** (`src/repositories/proxmox.repository.ts`) - ~137 lines
   - Uses Node's built-in `fetch` API
   - Manually handles HTTP requests, headers, SSL configuration
   - Manually parses and validates responses
   - Currently used in production via `ProxmoxTemplateFactory`

2. **ProxmoxApiRepository** (`src/repositories/proxmox-api.repository.ts`) - ~72 lines
   - Uses the `proxmox-api` npm package
   - Delegates HTTP handling, authentication, and SSL to the package
   - Simpler, cleaner code with less boilerplate
   - Only used in integration tests

### Problems with Current State
- **Code Duplication**: Two implementations doing the same thing
- **Maintenance Burden**: Must maintain custom HTTP logic, error handling, SSL configuration
- **Package Underutilized**: The `proxmox-api` dependency is installed but not used in production
- **Test Confusion**: Tests exist for the old implementation that won't be used going forward

### Benefits of Migration
- **Simpler Code**: ~47% reduction in lines of code (137 → 72 lines)
- **Better Abstraction**: Delegate low-level HTTP concerns to maintained package
- **Reduced Maintenance**: Package handles SSL, authentication, request formatting
- **Clearer Intent**: Code focuses on business logic, not HTTP mechanics
- **Single Implementation**: One source of truth for Proxmox API access

## Scope

### In Scope
- Update `ProxmoxTemplateFactory` to use `ProxmoxApiRepository`
- Remove `ProxmoxRepository` class (`src/repositories/proxmox.repository.ts`)
- Remove unit tests for `ProxmoxRepository` (`test/repositories/proxmox.repository.test.ts`)
- Verify all functionality continues to work after migration

### Out of Scope
- Adding new Proxmox functionality
- Changing the repository interface (`IProxmoxRepository`)
- Modifying service layer or command layer
- Changing configuration structure
- Modifying integration tests (they already use `ProxmoxApiRepository`)

## Impact Analysis

### Files to Modify
- `src/factories/proxmox-template.factory.ts` - Change import and instantiation

### Files to Delete
- `src/repositories/proxmox.repository.ts` - Old implementation
- `test/repositories/proxmox.repository.test.ts` - Old tests

### Files Unchanged
- `src/repositories/proxmox-api.repository.ts` - New implementation (already exists)
- `src/repositories/interfaces/proxmox.repository.interface.ts` - Interface (unchanged)
- `src/services/proxmox-template.service.ts` - Service layer (uses interface)
- `src/commands/proxmox/template/list.ts` - Command layer (no changes needed)
- `test/integration/proxmox-api.integration.test.ts` - Already uses new repository
- `test/services/proxmox-template.service.test.ts` - Uses interface, not implementation

### Breaking Changes
None. This is an internal implementation swap. The public API (CLI commands) and contract (repository interface) remain unchanged.

### Risk Assessment
**Low Risk**
- Both implementations conform to same interface (`IProxmoxRepository`)
- Integration tests already validate `ProxmoxApiRepository` against real Proxmox server
- Service layer is decoupled via dependency injection
- Change is isolated to factory (single point of instantiation)

## Testing Strategy

### Pre-Migration Validation
1. Verify integration tests pass with `ProxmoxApiRepository`
2. Verify unit tests pass for service layer

### Post-Migration Validation
1. Run full test suite to ensure no regressions
2. Manually test `homelab proxmox template list` command
3. Verify error handling works correctly (invalid credentials, network errors)

### Test Coverage After Migration
- Integration tests (`test/integration/proxmox-api.integration.test.ts`) - Tests real API calls
- Service tests (`test/services/proxmox-template.service.test.ts`) - Tests business logic with mocks
- Command tests (`test/commands/proxmox/template/list.test.ts`) - Tests CLI integration

Unit tests for repository implementation are no longer needed because:
- Integration tests validate real-world behavior
- Low-level HTTP handling is delegated to `proxmox-api` package (tested by package authors)
- Repository logic is minimal (filtering templates, mapping DTOs)

## Migration Path

### Phase 1: Preparation (Verification)
1. Confirm `ProxmoxApiRepository` passes all integration tests
2. Review factory to understand current wiring

### Phase 2: Implementation (Swap)
1. Update `ProxmoxTemplateFactory` to instantiate `ProxmoxApiRepository`
2. Delete `ProxmoxRepository` class file
3. Delete `ProxmoxRepository` test file

### Phase 3: Validation
1. Run full test suite (`pnpm test`)
2. Run linter (`pnpm run lint`)
3. Build project (`pnpm run build`)
4. Manual smoke test of CLI command

## Rollback Plan
If issues arise, revert the factory change to use `ProxmoxRepository` again. The old repository code can be restored from git history.

## Success Criteria
- [ ] All tests pass (`pnpm test`)
- [ ] Linter passes (`pnpm run lint`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] `homelab proxmox template list` command works correctly
- [ ] Old repository file deleted
- [ ] Old repository test file deleted
- [ ] Code is simpler and easier to maintain

## Dependencies
None. This is a self-contained refactoring.

## Timeline Estimate
**1-2 hours** (small change, single file update + deletions)

## References
- Original implementation: `src/repositories/proxmox.repository.ts`
- New implementation: `src/repositories/proxmox-api.repository.ts`
- Factory: `src/factories/proxmox-template.factory.ts`
- Integration tests: `test/integration/proxmox-api.integration.test.ts`
- `proxmox-api` package: https://www.npmjs.com/package/proxmox-api
