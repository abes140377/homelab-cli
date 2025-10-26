import {z} from 'zod';

/**
 * Zod schema for Proxmox configuration validation.
 * Validates environment variables for Proxmox API connection.
 *
 * Uses granular environment variables:
 * - PROXMOX_USER: Proxmox user (e.g., 'root')
 * - PROXMOX_REALM: Authentication realm (e.g., 'pam')
 * - PROXMOX_TOKEN_KEY: Token identifier (e.g., 'homelabcli')
 * - PROXMOX_TOKEN_SECRET: Token secret (UUID format)
 * - PROXMOX_HOST: Hostname without protocol (e.g., 'proxmox.home.sflab.io')
 * - PROXMOX_PORT: Port number (defaults to 8006 if not provided)
 * - PROXMOX_REJECT_UNAUTHORIZED: Verify SSL certificates (defaults to true)
 */
export const ProxmoxConfigSchema = z.object({
  host: z.string().min(1, 'PROXMOX_HOST must not be empty'),
  port: z
    .number()
    .int()
    .positive('PROXMOX_PORT must be a positive integer')
    .default(8006),
  realm: z.string().min(1, 'PROXMOX_REALM must not be empty'),
  rejectUnauthorized: z.boolean().default(true),
  tokenKey: z.string().min(1, 'PROXMOX_TOKEN_KEY must not be empty'),
  tokenSecret: z
    .string()
    .min(1, 'PROXMOX_TOKEN_SECRET must not be empty')
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      'PROXMOX_TOKEN_SECRET must be a valid UUID format',
    ),
  user: z.string().min(1, 'PROXMOX_USER must not be empty'),
});
