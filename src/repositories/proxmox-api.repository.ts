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
      // Construct tokenID from user@realm!tokenKey format
      const tokenID = `${this.config.user}@${this.config.realm}!${this.config.tokenKey}`;
      const {tokenSecret} = this.config;

      // Create proxmox client with token authentication
      const proxmox = proxmoxApi({
        host: this.config.host,
        port: this.config.port,
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
