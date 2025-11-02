import proxmoxApi from 'proxmox-api';

import {type ProxmoxConfig} from '../config/proxmox.config.js';
import {RepositoryError} from '../errors/repository.error.js';
import {type ProxmoxTemplateDTO} from '../models/proxmox-template.dto.js';
import {type ProxmoxVMDTO} from '../models/proxmox-vm.dto.js';
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
   * Retrieves resources (VMs or LXC containers) from Proxmox API with network information.
   * @param resourceType Type of resource to list: 'qemu' for VMs or 'lxc' for containers
   * @returns Result containing array of resources or an error
   */
  async listResources(resourceType: 'lxc' | 'qemu'): Promise<Result<ProxmoxVMDTO[], RepositoryError>> {
    try {
      // Construct tokenID from user@realm!tokenKey format
      const tokenID = `${this.config.user}@${this.config.realm}!${this.config.tokenKey}`;
      const {tokenSecret} = this.config;

      // Disable SSL verification for self-signed certificates if configured
      if (!this.config.rejectUnauthorized) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

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

      console.log('Fetched resources from Proxmox API:', response);

      // Filter resources based on type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resources = (response as any[]).filter((resource: any) =>
        // For QEMU: filter by type 'qemu' and exclude templates
        // For LXC: filter by type 'lxc'
        resourceType === 'qemu'
          ? resource.type === 'qemu' && resource.template !== 1
          : resource.type === 'lxc',
      );

      // Process each resource to get network information
      const resourcesWithNetworkInfo: ProxmoxVMDTO[] = [];

      for (const resource of resources) {
        // Sequential processing is intentional to avoid overwhelming the API
        // eslint-disable-next-line no-await-in-loop
        const ipv4Address = await this.fetchVMIPAddress(proxmox, resource.node, resource.vmid, resourceType);

        resourcesWithNetworkInfo.push({
          ipv4Address,
          name: resource.name || '',
          node: resource.node || '',
          status: resource.status || '',
          vmid: resource.vmid || 0,
        });
      }

      return success(resourcesWithNetworkInfo);
    } catch (error) {
      return failure(
        new RepositoryError(`Failed to retrieve ${resourceType} resources from Proxmox API`, {
          cause: error instanceof Error ? error : undefined,
          context: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        }),
      );
    }
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

      // Disable SSL verification for self-signed certificates if configured
      if (!this.config.rejectUnauthorized) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

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

  /**
   * Extracts IPv4 address from a network interface object.
   * @param iface Network interface object
   * @returns IPv4 address or null
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractIPv4FromInterface(iface: any): null | string {
    if (iface['ip-addresses'] && Array.isArray(iface['ip-addresses'])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const addr of iface['ip-addresses'] as any[]) {
        // Look for IPv4 addresses only
        if (addr['ip-address-type'] === 'ipv4' && addr['ip-address']) {
          return addr['ip-address'];
        }
      }
    }

    return null;
  }

  /**
   * Fetches the primary IPv4 address for a resource (VM or LXC) from the guest agent.
   * Returns null if guest agent is not available or no IPv4 address is found.
   * @param proxmox Proxmox API client
   * @param node Node name where resource is hosted
   * @param vmid Virtual Machine or Container ID
   * @param resourceType Type of resource ('qemu' or 'lxc')
   * @returns Primary IPv4 address or null
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchVMIPAddress(proxmox: any, node: string, vmid: number, resourceType: 'lxc' | 'qemu'): Promise<null | string> {
    try {
      // Call guest agent to get network interfaces
      // Use dynamic path based on resource type: /nodes/{node}/{resourceType}/{vmid}/agent/network-get-interfaces
      const networkInfo = await proxmox.nodes.$(node)[resourceType].$(vmid).agent['network-get-interfaces'].$get();

      if (!networkInfo || !networkInfo.result || !Array.isArray(networkInfo.result)) {
        return null;
      }

      // Find the first non-loopback interface with an IPv4 address
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const iface of networkInfo.result as any[]) {
        // Skip loopback interfaces
        if (iface.name && iface.name.toLowerCase().includes('lo')) {
          continue;
        }

        // Check if interface has IP addresses and find IPv4
        const ipv4 = this.extractIPv4FromInterface(iface);
        if (ipv4) {
          return ipv4;
        }
      }

      return null;
    } catch {
      // Guest agent may not be installed or resource may be stopped
      // Return null instead of failing the entire operation
      return null;
    }
  }
}
