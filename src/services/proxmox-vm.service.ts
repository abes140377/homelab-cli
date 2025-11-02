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
   * Lists all Proxmox VMs (non-templates), sorted by VMID ascending.
   * @returns Result containing array of VMs or an error
   */
  async listVMs(): Promise<Result<ProxmoxVMDTO[], ServiceError>> {
    const repositoryResult = await this.repository.listVMs();

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve VMs from Proxmox', {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema
    const validationResult = ProxmoxVMSchema.array().safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('VM data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    // Sort VMs by vmid ascending
    const sortedVMs = validationResult.data.sort((a, b) => a.vmid - b.vmid);

    return success(sortedVMs);
  }
}
