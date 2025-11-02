import {z} from 'zod';

import {ProxmoxVMSchema} from './schemas/proxmox-vm.schema.js';

/**
 * Proxmox VM Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ProxmoxVMDTO = z.infer<typeof ProxmoxVMSchema>;
