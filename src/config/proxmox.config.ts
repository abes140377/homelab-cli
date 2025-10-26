import {z} from 'zod';

import {ProxmoxConfigSchema} from './schemas/proxmox-config.schema.js';

/**
 * Proxmox configuration type inferred from Zod schema.
 */
export type ProxmoxConfig = z.infer<typeof ProxmoxConfigSchema>;

/**
 * Loads and validates Proxmox configuration from environment variables.
 * @returns Validated Proxmox configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function loadProxmoxConfig(): ProxmoxConfig {
  const host = process.env.PROXMOX_HOST;
  const apiToken = process.env.PROXMOX_API_TOKEN;

  if (!host) {
    throw new Error('PROXMOX_HOST environment variable is required');
  }

  if (!apiToken) {
    throw new Error('PROXMOX_API_TOKEN environment variable is required');
  }

  const result = ProxmoxConfigSchema.safeParse({
    apiToken,
    host,
  });

  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(`Proxmox configuration validation failed: ${errors}`);
  }

  return result.data;
}
