# Implementation Tasks

## 1. Update Zod Schema
- [ ] 1.1 Modify `src/config/schemas/proxmox-config.schema.ts` to accept new environment variables
- [ ] 1.2 Add validation for `PROXMOX_USER` (non-empty string)
- [ ] 1.3 Add validation for `PROXMOX_REALM` (non-empty string)
- [ ] 1.4 Add validation for `PROXMOX_TOKEN_KEY` (non-empty string)
- [ ] 1.5 Add validation for `PROXMOX_TOKEN_SECRET` (non-empty string, UUID format preferred)
- [ ] 1.6 Add validation for `PROXMOX_HOST` (non-empty string, hostname without protocol)
- [ ] 1.7 Add validation for `PROXMOX_PORT` (positive integer, default 8006)
- [ ] 1.8 Remove old validations for `apiToken` format and `host` URL format

## 2. Update Configuration Loader
- [ ] 2.1 Modify `src/config/proxmox.config.ts` to read new environment variables
- [ ] 2.2 Add individual checks for each required environment variable with specific error messages
- [ ] 2.3 Compose `tokenID` from `{user}@{realm}!{tokenKey}` format
- [ ] 2.4 Keep `tokenSecret` as-is from `PROXMOX_TOKEN_SECRET`
- [ ] 2.5 Apply default port value `8006` if `PROXMOX_PORT` is not set
- [ ] 2.6 Ensure configuration type export remains compatible with repository usage

## 3. Update Configuration Type
- [ ] 3.1 Review the `ProxmoxConfig` type inferred from schema
- [ ] 3.2 Ensure the exported type includes all necessary fields for repository usage (apiToken/tokenID, tokenSecret, host, port)
- [ ] 3.3 Consider whether internal representation should match environment variables or repository needs

## 4. Update Repository Integration
- [ ] 4.1 Review `src/repositories/proxmox-api.repository.ts` to ensure it works with new config structure
- [ ] 4.2 Verify that token parsing logic in repository is compatible with new config format
- [ ] 4.3 Verify that host/port parsing logic works with new config format
- [ ] 4.4 Update repository if needed to work with new config shape

## 5. Update Unit Tests
- [ ] 5.1 Update `test/config/proxmox.config.test.ts` to use new environment variables
- [ ] 5.2 Add test for successful load with all six variables
- [ ] 5.3 Add test for default port behavior when `PROXMOX_PORT` is omitted
- [ ] 5.4 Add test for missing `PROXMOX_USER` error
- [ ] 5.5 Add test for missing `PROXMOX_REALM` error
- [ ] 5.6 Add test for missing `PROXMOX_TOKEN_KEY` error
- [ ] 5.7 Add test for missing `PROXMOX_TOKEN_SECRET` error
- [ ] 5.8 Add test for missing `PROXMOX_HOST` error
- [ ] 5.9 Add test for invalid `PROXMOX_PORT` (non-integer) error
- [ ] 5.10 Add test for empty required variables
- [ ] 5.11 Remove old tests for `PROXMOX_API_TOKEN` format validation
- [ ] 5.12 Remove old tests for `PROXMOX_HOST` URL validation

## 6. Update Integration Tests
- [ ] 6.1 Update `test/integration/proxmox-api.integration.test.ts` file comments
- [ ] 6.2 Update documentation to explain new environment variable format
- [ ] 6.3 Update examples in comments to show new variable names
- [ ] 6.4 Ensure tests still work with new config (they should auto-adapt if config loader is correct)

## 7. Update Documentation
- [ ] 7.1 Update `.env.example` with new environment variable format
- [ ] 7.2 Add migration guide comments in `.env.example` showing old → new mapping
- [ ] 7.3 Document default port behavior
- [ ] 7.4 Include examples for different authentication scenarios

## 8. Testing and Validation
- [ ] 8.1 Run unit tests: `pnpm test test/config/proxmox.config.test.ts`
- [ ] 8.2 Run integration tests with new variables set: `pnpm test test/integration/proxmox-api.integration.test.ts`
- [ ] 8.3 Verify all existing Proxmox commands still work with new configuration
- [ ] 8.4 Run full test suite: `pnpm test`
- [ ] 8.5 Run linter: `pnpm run lint`
- [ ] 8.6 Build project: `pnpm run build`
