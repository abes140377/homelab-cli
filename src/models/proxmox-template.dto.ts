import {z} from 'zod';

import {ProxmoxTemplateSchema} from './schemas/proxmox-template.schema.js';

/**
 * Proxmox Template Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ProxmoxTemplateDTO = z.infer<typeof ProxmoxTemplateSchema>;
