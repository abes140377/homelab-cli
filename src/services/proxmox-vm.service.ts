import {ServiceError} from '../errors/service.error.js';
import {type ProxmoxVMDTO} from '../models/proxmox-vm.dto.js';
import {ProxmoxVMSchema} from '../models/schemas/proxmox-vm.schema.js';
import {type IProxmoxRepository} from '../repositories/interfaces/proxmox.repository.interface.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for Proxmox VM business logic.
 * Orchestrates repository calls, applies validation, and sorting.
 */
export class ProxmoxVMService {
  constructor(private readonly repository: IProxmoxRepository) {}

  /**
   * Lists Proxmox resources (VMs or LXC containers), sorted by VMID ascending.
   * @param resourceType Type of resource to list: 'qemu' for VMs or 'lxc' for containers
   * @returns Result containing array of resources or an error
   */
  async listVMs(resourceType: 'lxc' | 'qemu'): Promise<Result<ProxmoxVMDTO[], ServiceError>> {
    const repositoryResult = await this.repository.listResources(resourceType);

    if (!repositoryResult.success) {
      return failure(
        new ServiceError(`Failed to retrieve ${resourceType} resources from Proxmox`, {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema
    const validationResult = ProxmoxVMSchema.array().safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('Resource data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    // Sort resources by vmid ascending
    const sortedResources = validationResult.data.sort((a, b) => a.vmid - b.vmid);

    return success(sortedResources);
  }
}
