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
   * Clones a VM template to create a new VM using full clone mode.
   * @param node Node where template resides
   * @param templateVmid VMID of the template to clone
   * @param newVmid VMID for the new VM
   * @param vmName Name for the new VM
   * @returns Result containing task UPID or an error
   */
  cloneFromTemplate(
    node: string,
    templateVmid: number,
    newVmid: number,
    vmName: string,
  ): Promise<Result<string, RepositoryError>>;

  /**
   * Finds the next available VMID in the Proxmox cluster.
   * Searches for gaps in the VMID sequence starting from 100.
   * @returns Result containing next available VMID or an error
   */
  getNextAvailableVmid(): Promise<Result<number, RepositoryError>>;

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

  /**
   * Sets configuration parameters for a VM.
   * Used for cloud-init and other VM configuration settings.
   * @param node Node where VM resides
   * @param vmid VM ID
   * @param config Configuration parameters as key-value pairs
   * @returns Result indicating success or error
   */
  setVMConfig(
    node: string,
    vmid: number,
    config: Record<string, boolean | number | string>,
  ): Promise<Result<void, RepositoryError>>;

  /**
   * Waits for a Proxmox task to complete with timeout support.
   * Polls the task status endpoint until completion or timeout.
   * @param node Node where task is running
   * @param upid Task UPID
   * @param timeoutMs Timeout in milliseconds (default 300000 = 5 minutes)
   * @returns Result indicating success or error
   */
  waitForTask(node: string, upid: string, timeoutMs?: number): Promise<Result<void, RepositoryError>>;
}
