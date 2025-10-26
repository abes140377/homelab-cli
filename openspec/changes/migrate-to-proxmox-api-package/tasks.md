# Implementation Tasks

## 1. Pre-Migration Verification
- [ ] 1.1 Run integration tests to verify `ProxmoxApiRepository` works: `pnpm exec mocha --forbid-only "test/integration/proxmox-api.integration.test.ts"`
- [ ] 1.2 Run service tests to verify service layer works: `pnpm exec mocha --forbid-only "test/services/proxmox-template.service.test.ts"`
- [ ] 1.3 Run full test suite to establish baseline: `pnpm test`

## 2. Update Factory to Use ProxmoxApiRepository
- [ ] 2.1 Open `src/factories/proxmox-template.factory.ts`
- [ ] 2.2 Change import from `ProxmoxRepository` to `ProxmoxApiRepository`
- [ ] 2.3 Change instantiation from `new ProxmoxRepository(config)` to `new ProxmoxApiRepository(config)`
- [ ] 2.4 Verify no other code in file needs changes

## 3. Remove Old Repository Implementation
- [ ] 3.1 Delete file: `src/repositories/proxmox.repository.ts`
- [ ] 3.2 Verify no remaining imports of `ProxmoxRepository` in codebase: `rg "ProxmoxRepository" src/`
- [ ] 3.3 Verify no remaining references in production code (tests can still reference for now)

## 4. Remove Old Repository Tests
- [ ] 4.1 Delete file: `test/repositories/proxmox.repository.test.ts`
- [ ] 4.2 Verify no other test files reference this test file

## 5. Post-Migration Validation
- [ ] 5.1 Run full test suite: `pnpm test`
- [ ] 5.2 Verify all tests pass (no regressions)
- [ ] 5.3 Run linter: `pnpm run lint`
- [ ] 5.4 Fix any linting issues if they arise
- [ ] 5.5 Build project: `pnpm run build`
- [ ] 5.6 Verify build succeeds without errors

## 6. Manual Testing
- [ ] 6.1 Test command with real Proxmox server (if available): `./bin/dev.js proxmox template list`
- [ ] 6.2 Verify output matches expected format
- [ ] 6.3 Test with invalid credentials to verify error handling (optional)

## 7. Final Verification
- [ ] 7.1 Review git diff to ensure only expected files changed/deleted
- [ ] 7.2 Verify no unintended changes to other files
- [ ] 7.3 Confirm factory is the only file modified (besides deletions)

## Notes
- This is a low-risk change because both implementations use the same interface
- Integration tests already validate `ProxmoxApiRepository` against real Proxmox
- Service layer is decoupled via dependency injection, so it won't be affected
- All changes are isolated to the factory (single point of instantiation)

## Success Criteria
All tasks completed successfully:
- Factory updated to use `ProxmoxApiRepository`
- Old repository file deleted
- Old test file deleted
- All tests pass
- Linter passes
- Build succeeds
- Manual testing confirms functionality works
