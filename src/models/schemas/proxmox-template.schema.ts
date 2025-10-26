import {z} from 'zod';

/**
 * Zod schema for Proxmox template validation.
 * Serves as the single source of truth for Proxmox template data structure.
 */
export const ProxmoxTemplateSchema = z.object({
  name: z.string().min(1, 'Template name must not be empty'),
  template: z.literal(1),
  vmid: z.number().int().positive('VMID must be a positive integer'),
});
