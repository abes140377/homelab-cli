import {type RepositoryError} from '../../errors/repository.error.js';
import {type ProxmoxTemplateDTO} from '../../models/proxmox-template.dto.js';
import {type ProxmoxVMDTO} from '../../models/proxmox-vm.dto.js';
import {type Result} from '../../utils/result.js';

/**
 * Interface for Proxmox repository.
 * Defines the contract for Proxmox API data access operations.
 */
export interface IProxmoxRepository {
  /**
   * Retrieves resources (VMs or LXC containers) from Proxmox with network information.
   * @param resourceType Type of resource to list: 'qemu' for VMs or 'lxc' for containers
   * @returns Result containing array of resources or an error
   */
  listResources(resourceType: 'lxc' | 'qemu'): Promise<Result<ProxmoxVMDTO[], RepositoryError>>;

  /**
   * Retrieves all VM templates from Proxmox.
   * @returns Result containing array of templates or an error
   */
  listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>>;
}
