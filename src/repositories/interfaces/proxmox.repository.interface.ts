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
   * Retrieves all VM templates from Proxmox.
   * @returns Result containing array of templates or an error
   */
  listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>>;

  /**
   * Retrieves all VMs (non-templates) from Proxmox with network information.
   * @returns Result containing array of VMs or an error
   */
  listVMs(): Promise<Result<ProxmoxVMDTO[], RepositoryError>>;
}
