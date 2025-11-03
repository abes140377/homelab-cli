# Design: add-proxmox-vm-cloudinit

## Overview
This document outlines the architectural decisions for implementing cloud-init configuration support for Proxmox VMs in the homelab-cli.

## Architecture

### Layered Approach
Following the established project architecture pattern, this feature will span three layers:

```
Command Layer (CLI Interface)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (API Access)
```

### Component Design

#### 1. Command Layer: ProxmoxVmCloudinit
**Location**: `src/commands/proxmox/vm/cloudinit.ts`

**Responsibilities**:
- Parse and validate CLI arguments and flags
- Read SSH key file from filesystem (default: `./keys/admin_id_ecdsa.pub`)
- Display user-friendly progress and result messages
- Convert service errors to CLI errors

**Arguments**:
```typescript
static args = {
  vmid: Args.integer({
    description: 'VM ID to configure',
    required: true,
  }),
}
```

**Flags**:
```typescript
static flags = {
  user: Flags.string({
    description: 'Username for the default user',
    default: 'admin',
  }),
  password: Flags.string({
    description: 'Password for the default user (empty = no password)',
    default: '',
  }),
  'ssh-key': Flags.string({
    description: 'SSH public key or path to key file',
    default: './keys/admin_id_ecdsa.pub',
  }),
  upgrade: Flags.boolean({
    description: 'Automatically upgrade packages on first boot',
    default: false,
  }),
  ipconfig: Flags.string({
    description: 'IPv4 configuration for eth0 (dhcp or ip=X.X.X.X/YY[,gw=X.X.X.X])',
    default: 'dhcp',
  }),
}
```

**Key Decision**: SSH key flag accepts either file path or direct key content. Command will detect if value is a file path and read it; otherwise treat as key content.

#### 2. Service Layer: ProxmoxVMService
**Location**: `src/services/proxmox-vm.service.ts` (extend existing service)

**New Method**:
```typescript
async configureCloudInit(
  vmid: number,
  config: CloudInitConfigDTO
): Promise<Result<void, ServiceError>>
```

**Responsibilities**:
- Validate CloudInitConfigDTO using Zod schema
- Resolve node name for the given VMID (query cluster resources)
- Format parameters for Proxmox API (URL-encode SSH keys, validate IP format)
- Call repository method with validated parameters
- Wrap repository errors in ServiceError

**Key Decision**: Auto-detect node from VMID to simplify command interface. This matches the pattern used in other commands.

#### 3. Repository Layer: ProxmoxApiRepository
**Location**: `src/repositories/proxmox-api.repository.ts` (extend existing repository)

**New Method**:
```typescript
async setVMConfig(
  node: string,
  vmid: number,
  config: Record<string, string | number | boolean>
): Promise<Result<void, RepositoryError>>
```

**API Call**:
```typescript
// PUT /nodes/{node}/qemu/{vmid}/config
await proxmox.nodes.$(node).qemu.$(vmid).config.$put({
  ciuser: config.ciuser,
  cipassword: config.cipassword,
  sshkeys: encodeURIComponent(config.sshkeys), // URL-encoded
  ipconfig0: config.ipconfig0,
  ciupgrade: config.ciupgrade ? 1 : 0,
})
```

**Key Decision**: Use generic `config` parameter to allow flexibility for future cloud-init parameters without interface changes.

#### 4. Model Layer
**Location**: `src/models/` and `src/models/schemas/`

**New DTO**:
```typescript
// src/models/cloud-init-config.dto.ts
export class CloudInitConfigDTO {
  constructor(
    public readonly user: string,
    public readonly password: string,
    public readonly sshKeys: string,
    public readonly ipconfig0: string,
    public readonly upgrade: boolean,
  ) {}
}
```

**New Schema**:
```typescript
// src/models/schemas/cloud-init-config.schema.ts
import {z} from 'zod'

// Validate IP configuration format
const ipConfigSchema = z.union([
  z.literal('dhcp'),
  z.string().regex(
    /^ip=\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}(,gw=\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/,
    'Must be "dhcp" or "ip=X.X.X.X/YY[,gw=X.X.X.X]"'
  ),
])

export const CloudInitConfigSchema = z.object({
  user: z.string().min(1, 'Username cannot be empty'),
  password: z.string(), // Empty string is allowed
  sshKeys: z.string(), // Can be empty if password is set
  ipconfig0: ipConfigSchema,
  upgrade: z.boolean(),
})
```

## Data Flow

```
User Input (CLI)
    ↓
1. Command validates args/flags
    ↓
2. Command reads SSH key file (if path provided)
    ↓
3. Command creates CloudInitConfigDTO
    ↓
4. Service validates DTO with Zod
    ↓
5. Service resolves node from vmid
    ↓
6. Service formats parameters (URL-encode SSH keys)
    ↓
7. Repository calls Proxmox API
    ↓
8. Result propagates back through layers
    ↓
9. Command displays success/error message
```

## Error Handling

### Validation Errors
- **Invalid VMID**: Command validation, exit code 1
- **Invalid IP format**: Zod validation in service, ServiceError
- **SSH key file not found**: Command layer fs.readFile error, exit code 1
- **Empty username**: Zod validation in service, ServiceError

### API Errors
- **VMID does not exist**: Repository returns RepositoryError, command displays "VM {vmid} not found"
- **Network error**: Repository returns RepositoryError with cause, command displays connection error
- **API rejection** (invalid parameters): Repository returns RepositoryError, command displays API error message

## File Organization

```
src/
├── commands/proxmox/vm/
│   └── cloudinit.ts                    # New command
├── services/
│   └── proxmox-vm.service.ts           # Extend with configureCloudInit()
├── repositories/
│   ├── interfaces/
│   │   └── proxmox.repository.interface.ts  # Add setVMConfig()
│   └── proxmox-api.repository.ts       # Implement setVMConfig()
├── models/
│   ├── cloud-init-config.dto.ts        # New DTO
│   └── schemas/
│       └── cloud-init-config.schema.ts # New schema

test/
├── commands/proxmox/vm/
│   └── cloudinit.test.ts               # New command test
├── services/
│   └── proxmox-vm.service.test.ts      # Extend with cloud-init tests
└── repositories/
    └── proxmox-api.repository.test.ts  # Extend with setVMConfig tests
```

## Key Design Decisions

### 1. Node Auto-Detection
**Decision**: Command does not require node parameter; service auto-detects from VMID.

**Rationale**:
- Consistent with user mental model (users think about VMs by VMID, not node)
- Reduces parameter burden on users
- Matches pattern used in other commands

**Trade-off**: Requires additional API call to resolve node, but this is acceptable for usability.

### 2. SSH Key File Reading
**Decision**: Command layer reads SSH key file, not service layer.

**Rationale**:
- Command layer is responsible for filesystem access
- Service layer remains pure business logic (no I/O)
- Easier to test service layer without mocking filesystem

**Trade-off**: Command layer is slightly thicker, but maintains clean architecture.

### 3. Generic setVMConfig Repository Method
**Decision**: Repository method accepts generic config object, not specific cloud-init parameters.

**Rationale**:
- Allows adding future configuration parameters without interface changes
- Proxmox API /config endpoint accepts many parameters beyond cloud-init
- Simplifies repository interface (single method for all config updates)

**Trade-off**: Less type safety at repository boundary, but Zod validation in service layer provides safety.

### 4. IP Configuration Validation
**Decision**: Validate IP format with regex in Zod schema, not in command layer.

**Rationale**:
- Validation logic centralized in one place (schema)
- Service layer can validate regardless of caller (command, API, tests)
- Zod provides clear validation error messages

**Trade-off**: Regex can be complex, but well-tested and documented.

### 5. Password Default
**Decision**: Default password is empty string (no password set).

**Rationale**:
- Aligns with security best practice (SSH key authentication preferred)
- Proxmox documentation recommends SSH keys over passwords
- Empty string means "do not set password" in Proxmox API

**Trade-off**: Users must explicitly set password if desired, but this encourages secure defaults.

## Testing Strategy

### Unit Tests
- **Repository**: Mock proxmox-api client, verify correct API calls with URL-encoded parameters
- **Service**: Mock repository, verify validation logic and node resolution
- **Command**: Use `@oclif/test` runCommand, verify output and error messages

### Integration Tests
- Optional: Test against real Proxmox instance (requires credentials and test VM)
- Verify end-to-end flow from command to API call

### Test Scenarios
1. Configure cloud-init with DHCP
2. Configure cloud-init with static IP (no gateway)
3. Configure cloud-init with static IP and gateway
4. SSH key from file path
5. SSH key as direct content
6. Invalid IP format (validation error)
7. VMID does not exist (API error)
8. SSH key file not found (filesystem error)

## Future Enhancements
- Support multiple network interfaces (ipconfig1, ipconfig2, etc.)
- Support IPv6 configuration when needed
- Support custom cloud-init snippets (cicustom parameter)
- Support other cloud-init parameters (nameserver, searchdomain, etc.)
