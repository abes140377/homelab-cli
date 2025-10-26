import {z} from 'zod';

/**
 * Zod schema for Proxmox configuration validation.
 * Validates environment variables for Proxmox API connection.
 */
export const ProxmoxConfigSchema = z.object({
  apiToken: z
    .string()
    .min(1, 'PROXMOX_API_TOKEN must not be empty')
    .refine(
      (token) => token.includes('!') && token.includes('='),
      'PROXMOX_API_TOKEN must be in format user@realm!tokenid=secret',
    ),
  host: z
    .string()
    .url('PROXMOX_HOST must be a valid URL')
    .refine(
      (url) => url.startsWith('https://') || url.startsWith('http://'),
      'PROXMOX_HOST must start with https:// or http://',
    ),
});
