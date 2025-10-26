import {z} from 'zod';

import {ProxmoxConfigSchema} from './schemas/proxmox-config.schema.js';

/**
 * Proxmox configuration type inferred from Zod schema.
 */
export type ProxmoxConfig = z.infer<typeof ProxmoxConfigSchema>;

/**
 * Loads and validates Proxmox configuration from environment variables.
 *
 * Required environment variables:
 * - PROXMOX_USER: Proxmox user (e.g., 'root')
 * - PROXMOX_REALM: Authentication realm (e.g., 'pam')
 * - PROXMOX_TOKEN_KEY: Token identifier (e.g., 'homelabcli')
 * - PROXMOX_TOKEN_SECRET: Token secret (UUID format)
 * - PROXMOX_HOST: Hostname without protocol (e.g., 'proxmox.home.sflab.io')
 *
 * Optional environment variables:
 * - PROXMOX_PORT: Port number (defaults to 8006)
 * - PROXMOX_REJECT_UNAUTHORIZED: Verify SSL certificates (defaults to true, set to 'false' for self-signed certs)
 *
 * @returns Validated Proxmox configuration
 * @throws Error if required environment variables are missing or invalid
 */
export function loadProxmoxConfig(): ProxmoxConfig {
  const user = process.env.PROXMOX_USER;
  const realm = process.env.PROXMOX_REALM;
  const tokenKey = process.env.PROXMOX_TOKEN_KEY;
  const tokenSecret = process.env.PROXMOX_TOKEN_SECRET;
  const host = process.env.PROXMOX_HOST;
  const portStr = process.env.PROXMOX_PORT;
  const rejectUnauthorizedStr = process.env.PROXMOX_REJECT_UNAUTHORIZED;

  // Check required variables with specific error messages
  if (!user) {
    throw new Error('PROXMOX_USER environment variable is required');
  }

  if (!realm) {
    throw new Error('PROXMOX_REALM environment variable is required');
  }

  if (!tokenKey) {
    throw new Error('PROXMOX_TOKEN_KEY environment variable is required');
  }

  if (!tokenSecret) {
    throw new Error('PROXMOX_TOKEN_SECRET environment variable is required');
  }

  if (!host) {
    throw new Error('PROXMOX_HOST environment variable is required');
  }

  // Parse port if provided, otherwise use undefined (will trigger default in schema)
  const port = portStr ? Number.parseInt(portStr, 10) : undefined;

  // Parse rejectUnauthorized if provided, otherwise use undefined (will trigger default in schema)
  const rejectUnauthorized =
    rejectUnauthorizedStr === undefined
      ? undefined
      : rejectUnauthorizedStr.toLowerCase() !== 'false';

  const result = ProxmoxConfigSchema.safeParse({
    host,
    port,
    realm,
    rejectUnauthorized,
    tokenKey,
    tokenSecret,
    user,
  });

  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message).join(', ');
    throw new Error(`Proxmox configuration validation failed: ${errors}`);
  }

  return result.data;
}
