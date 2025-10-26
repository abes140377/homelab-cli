# Implementation Tasks

## 1. Update Zod Schema
- [x] 1.1 Modify `src/config/schemas/proxmox-config.schema.ts` to accept new environment variables
- [x] 1.2 Add validation for `PROXMOX_USER` (non-empty string)
- [x] 1.3 Add validation for `PROXMOX_REALM` (non-empty string)
- [x] 1.4 Add validation for `PROXMOX_TOKEN_KEY` (non-empty string)
- [x] 1.5 Add validation for `PROXMOX_TOKEN_SECRET` (non-empty string, UUID format preferred)
- [x] 1.6 Add validation for `PROXMOX_HOST` (non-empty string, hostname without protocol)
- [x] 1.7 Add validation for `PROXMOX_PORT` (positive integer, default 8006)
- [x] 1.8 Remove old validations for `apiToken` format and `host` URL format

## 2. Update Configuration Loader
- [x] 2.1 Modify `src/config/proxmox.config.ts` to read new environment variables
- [x] 2.2 Add individual checks for each required environment variable with specific error messages
- [x] 2.3 Compose `tokenID` from `{user}@{realm}!{tokenKey}` format
- [x] 2.4 Keep `tokenSecret` as-is from `PROXMOX_TOKEN_SECRET`
- [x] 2.5 Apply default port value `8006` if `PROXMOX_PORT` is not set
- [x] 2.6 Ensure configuration type export remains compatible with repository usage

## 3. Update Configuration Type
- [x] 3.1 Review the `ProxmoxConfig` type inferred from schema
- [x] 3.2 Ensure the exported type includes all necessary fields for repository usage (apiToken/tokenID, tokenSecret, host, port)
- [x] 3.3 Consider whether internal representation should match environment variables or repository needs

## 4. Update Repository Integration
- [x] 4.1 Review `src/repositories/proxmox-api.repository.ts` to ensure it works with new config structure
- [x] 4.2 Verify that token parsing logic in repository is compatible with new config format
- [x] 4.3 Verify that host/port parsing logic works with new config format
- [x] 4.4 Update repository if needed to work with new config shape

## 5. Update Unit Tests
- [x] 5.1 Update `test/config/proxmox.config.test.ts` to use new environment variables
- [x] 5.2 Add test for successful load with all six variables
- [x] 5.3 Add test for default port behavior when `PROXMOX_PORT` is omitted
- [x] 5.4 Add test for missing `PROXMOX_USER` error
- [x] 5.5 Add test for missing `PROXMOX_REALM` error
- [x] 5.6 Add test for missing `PROXMOX_TOKEN_KEY` error
- [x] 5.7 Add test for missing `PROXMOX_TOKEN_SECRET` error
- [x] 5.8 Add test for missing `PROXMOX_HOST` error
- [x] 5.9 Add test for invalid `PROXMOX_PORT` (non-integer) error
- [x] 5.10 Add test for empty required variables
- [x] 5.11 Remove old tests for `PROXMOX_API_TOKEN` format validation
- [x] 5.12 Remove old tests for `PROXMOX_HOST` URL validation

## 6. Update Integration Tests
- [x] 6.1 Update `test/integration/proxmox-api.integration.test.ts` file comments
- [x] 6.2 Update documentation to explain new environment variable format
- [x] 6.3 Update examples in comments to show new variable names
- [x] 6.4 Ensure tests still work with new config (they should auto-adapt if config loader is correct)

## 7. Update Documentation
- [x] 7.1 Update `.env.example` with new environment variable format
- [x] 7.2 Add migration guide comments in `.env.example` showing old → new mapping
- [x] 7.3 Document default port behavior
- [x] 7.4 Include examples for different authentication scenarios

## 8. Testing and Validation
- [x] 8.1 Run unit tests: `pnpm test test/config/proxmox.config.test.ts`
- [x] 8.2 Run integration tests with new variables set: `pnpm test test/integration/proxmox-api.integration.test.ts`
- [x] 8.3 Verify all existing Proxmox commands still work with new configuration
- [x] 8.4 Run full test suite: `pnpm test`
- [x] 8.5 Run linter: `pnpm run lint`
- [x] 8.6 Build project: `pnpm run build`
