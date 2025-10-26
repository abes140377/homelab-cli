# Refactor Proxmox Configuration Environment Variables

## Why
The current Proxmox configuration uses two monolithic environment variables (`PROXMOX_API_TOKEN` and `PROXMOX_HOST`) that combine multiple distinct configuration values. This creates several issues:
1. The `PROXMOX_API_TOKEN` format `user@realm!tokenid=secret` is error-prone and requires manual string parsing with special character escaping in shells
2. The `PROXMOX_HOST` includes both the hostname and port in a single URL, making it harder to configure and requiring URL parsing
3. The format doesn't align with standard environment variable conventions where each value is atomic

By splitting these into granular environment variables (`PROXMOX_USER`, `PROXMOX_REALM`, `PROXMOX_TOKEN_KEY`, `PROXMOX_TOKEN_SECRET`, `PROXMOX_HOST`, `PROXMOX_PORT`), we improve:
- Clarity: Each variable has a single, clear purpose
- Usability: No special character escaping needed
- Maintainability: Easier to update individual values without reconstructing complex formats
- Alignment: Matches how the proxmox-api npm package expects configuration

## What Changes
- **BREAKING**: Replace `PROXMOX_API_TOKEN` (format: `user@realm!tokenid=secret`) with four separate variables:
  - `PROXMOX_USER` (e.g., `root`)
  - `PROXMOX_REALM` (e.g., `pam`)
  - `PROXMOX_TOKEN_KEY` (e.g., `homelabcli`)
  - `PROXMOX_TOKEN_SECRET` (e.g., `bd2ed89e-6a09-48e8-8a6e-38da9128c8ce`)
- **BREAKING**: Replace `PROXMOX_HOST` (format: `https://host:port`) with two separate variables:
  - `PROXMOX_HOST` (hostname only, e.g., `proxmox.home.sflab.io`)
  - `PROXMOX_PORT` (port number, e.g., `8006`, with default `8006`)
- Update Zod schema to validate new environment variables
- Update config loader to read and compose new variables
- Update all tests to use new variable format
- Update documentation (.env.example, integration test comments)
- **Note**: The `.creds.env.yaml` file already contains the new format and is ready to use

## Impact
- **Affected specs**: `proxmox-configuration` (new capability)
- **Affected code**:
  - `src/config/schemas/proxmox-config.schema.ts` - Zod schema
  - `src/config/proxmox.config.ts` - Configuration loader
  - `test/config/proxmox.config.test.ts` - Unit tests
  - `test/integration/proxmox-api.integration.test.ts` - Integration tests (comments)
  - `.env.example` - Documentation
- **Breaking change**: Users must update their environment variables before upgrading
- **Migration path**: Clear mapping from old to new variables documented
