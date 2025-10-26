import {type ProxmoxConfig} from '../config/proxmox.config.js';
import {RepositoryError} from '../errors/repository.error.js';
import {type ProxmoxTemplateDTO} from '../models/proxmox-template.dto.js';
import {failure, type Result, success} from '../utils/result.js';
import {type IProxmoxRepository} from './interfaces/proxmox.repository.interface.js';

/**
 * Proxmox API response structure for cluster resources.
 */
interface ProxmoxAPIResponse {
  data: Array<{
    [key: string]: unknown;
    name?: string;
    template?: number;
    vmid?: number;
  }>;
}

/**
 * Implementation of Proxmox repository using Proxmox VE REST API.
 * Handles API communication with authentication and SSL configuration.
 */
export class ProxmoxRepository implements IProxmoxRepository {
  private readonly config: ProxmoxConfig;

  constructor(config: ProxmoxConfig) {
    this.config = config;
  }

  /**
   * Retrieves all VM templates from Proxmox API.
   * @returns Result containing array of templates or an error
   */
  async listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>> {
    try {
      // Parse API token: format is user@realm!tokenid=secret
      // We need: PVEAPIToken=tokenid=secret
      const tokenParts = this.config.apiToken.split('!');
      if (tokenParts.length !== 2) {
        return failure(
          new RepositoryError('Invalid API token format', {
            context: {apiToken: 'Token must contain ! separator'},
          }),
        );
      }

      const authToken = `PVEAPIToken=${tokenParts[1]}`;

      // Build API URL
      const url = `${this.config.host}/api2/json/cluster/resources?type=vm`;

      // Set environment variable to accept self-signed certificates
      // This is acceptable for homelab use where self-signed certs are common
      const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      try {
        // Call Proxmox API
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        const response = await fetch(url, {
          headers: {
            Authorization: authToken,
          },
          method: 'GET',
        });

        // Restore original setting
        if (originalRejectUnauthorized === undefined) {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        } else {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        }

        // Handle HTTP errors
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            return failure(
              new RepositoryError('Authentication failed - check API token', {
                context: {status: response.status},
              }),
            );
          }

          if (response.status === 404) {
            return failure(
              new RepositoryError('Proxmox API endpoint not found', {
                context: {status: response.status},
              }),
            );
          }

          if (response.status >= 500) {
            return failure(
              new RepositoryError('Proxmox server error', {
                context: {status: response.status},
              }),
            );
          }

          return failure(
            new RepositoryError(`HTTP error: ${response.status}`, {
              context: {status: response.status},
            }),
          );
        }

        // Parse JSON response
        let data: ProxmoxAPIResponse;
        try {
          data = (await response.json()) as ProxmoxAPIResponse;
        } catch {
          return failure(new RepositoryError('Invalid response from Proxmox API'));
        }

        // Validate response structure
        if (!data || !Array.isArray(data.data)) {
          return failure(new RepositoryError('Unexpected API response format'));
        }

        // Filter and map to templates only (template === 1)
        const templates: ProxmoxTemplateDTO[] = data.data
          .filter((resource) => resource.template === 1)
          .map((resource) => ({
            name: resource.name || '',
            template: 1 as const,
            vmid: resource.vmid || 0,
          }));

        return success(templates);
      } finally {
        // Ensure we always restore the original setting
        if (originalRejectUnauthorized === undefined) {
          delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        } else {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
        }
      }
    } catch (error) {
      return failure(
        new RepositoryError('Failed to connect to Proxmox API', {
          cause: error instanceof Error ? error : undefined,
        }),
      );
    }
  }
}
