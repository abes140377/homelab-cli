# Add Proxmox Template List Command

## Why

Homelab infrastructure commonly uses Proxmox VE for virtualization. Users need visibility into available VM templates to understand which templates are available for cloning and deployment. The `homelab proxmox template list` command provides this critical information by querying the Proxmox REST API and presenting templates in a clear, sortable format.

## What Changes

- Add `proxmox-template-management` capability with template listing functionality
- Implement `homelab proxmox template list` command to query and display Proxmox VM templates
- Create configuration layer (`src/config/`) with Zod-validated environment variable loading for Proxmox credentials
- Implement Proxmox repository using Node.js native fetch API for REST API integration
- Create Proxmox template domain model with vmid, name, and template status attributes
- Implement layered architecture: Command → Service → Repository → Proxmox API
- Use Result pattern for error handling and Zod schemas for validation
- Add cli-table3 dependency for formatted table output
- Support self-signed SSL certificates for local Proxmox installations

## Impact

- **Affected specs**: New capability `proxmox-template-management`
- **New dependencies**:
  - `cli-table3`: Table formatting library for consistent output
  - `@types/cli-table3`: TypeScript type definitions (dev dependency)
- **Affected code**:
  - New: `src/commands/proxmox/template/list.ts` (CLI layer)
  - New: `src/services/proxmox-template.service.ts` (business logic)
  - New: `src/repositories/proxmox.repository.ts` (Proxmox API integration)
  - New: `src/repositories/interfaces/proxmox.repository.interface.ts` (repository contract)
  - New: `src/models/schemas/proxmox-template.schema.ts` (Zod schemas)
  - New: `src/models/proxmox-template.dto.ts` (domain models)
  - New: `src/config/proxmox.config.ts` (Zod-validated config)
  - New: `src/config/schemas/proxmox-config.schema.ts` (config Zod schema)
  - New: `src/factories/proxmox-template.factory.ts` (dependency wiring)
  - New: `test/commands/proxmox/template/list.test.ts` (integration tests)
  - New: `test/services/proxmox-template.service.test.ts` (unit tests)
  - New: `test/repositories/proxmox.repository.test.ts` (unit tests)
  - New: `test/config/proxmox.config.test.ts` (config validation tests)
- **Environment variables required**:
  - `PROXMOX_HOST`: Proxmox server URL (e.g., `https://proxmox.home.sflab.io:8006`)
  - `PROXMOX_API_TOKEN`: API token in format `user@realm!tokenid=secret` (e.g., `root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce`)
