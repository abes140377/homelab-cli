import proxmoxApi from 'proxmox-api';

import {type ProxmoxConfig} from '../config/proxmox.config.js';
import {RepositoryError} from '../errors/repository.error.js';
import {type ProxmoxTemplateDTO} from '../models/proxmox-template.dto.js';
import {failure, type Result, success} from '../utils/result.js';
import {type IProxmoxRepository} from './interfaces/proxmox.repository.interface.js';


/**
 * Implementation of Proxmox repository using proxmox-api npm package.
 * Provides an alternative implementation to the fetch-based repository.
 */
export class ProxmoxApiRepository implements IProxmoxRepository {
  private readonly config: ProxmoxConfig;

  constructor(config: ProxmoxConfig) {
    this.config = config;
  }

  /**
   * Retrieves all VM templates from Proxmox API using proxmox-api package.
   * @returns Result containing array of templates or an error
   */
  async listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>> {
    try {
      // Parse API token: format is user@realm!tokenid=secret
      // We need: tokenID (user@realm!tokenid) and tokenSecret (secret)
      const tokenParts = this.config.apiToken.split('=');
      if (tokenParts.length !== 2) {
        return failure(
          new RepositoryError('Invalid API token format - expected format: user@realm!tokenid=secret', {
            context: {apiToken: 'Token must contain = separator'},
          }),
        );
      }

      const tokenID = tokenParts[0]; // user@realm!tokenid
      const tokenSecret = tokenParts[1]; // secret

      // Extract host without protocol for proxmox-api
      const hostUrl = new URL(this.config.host);
      const host = hostUrl.hostname;
      const port = hostUrl.port || '8006';

      // Create proxmox client with token authentication
      const proxmox = proxmoxApi({
        host,
        port: Number.parseInt(port, 10),
        tokenID,
        tokenSecret,
      });

      // Get cluster resources (type=vm)
      const response = await proxmox.cluster.resources.$get({type: 'vm'});

      // Validate response - proxmox-api returns array directly
      if (!response || !Array.isArray(response)) {
        return failure(new RepositoryError('Unexpected API response format'));
      }

      // Filter and map to templates only (template === 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const templates: ProxmoxTemplateDTO[] = (response as any[])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((resource: any) => resource.template === 1)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((resource: any) => ({
          name: resource.name || '',
          template: 1 as const,
          vmid: resource.vmid || 0,
        }));

      return success(templates);
    } catch (error) {
      return failure(
        new RepositoryError('Failed to connect to Proxmox API', {
          cause: error instanceof Error ? error : undefined,
          context: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        }),
      );
    }
  }
}
