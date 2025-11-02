import {z} from 'zod';

// IPv4 address regex pattern
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * Zod schema for Proxmox VM validation.
 * Serves as the single source of truth for Proxmox VM data structure.
 */
export const ProxmoxVMSchema = z.object({
  ipv4Address: z
    .string()
    .regex(ipv4Regex, 'Must be a valid IPv4 address')
    .nullable()
    .optional()
    .transform((val: null | string | undefined) => val ?? null),
  name: z.string().min(1, 'VM name must not be empty'),
  node: z.string().min(1, 'Node name must not be empty'),
  status: z.string().min(1, 'Status must not be empty'),
  vmid: z.number().int().positive('VMID must be a positive integer'),
});
