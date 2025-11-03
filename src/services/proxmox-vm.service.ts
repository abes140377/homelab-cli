import {ServiceError} from '../errors/service.error.js';
import {type ProxmoxTemplateDTO} from '../models/proxmox-template.dto.js';
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
   * Creates a new VM from a template by name.
   * Orchestrates: template resolution → VMID allocation → clone → wait for completion.
   * @param vmName Name for the new VM
   * @param templateName Name of the template to clone from
   * @returns Result containing new VM details {vmid, name, node} or an error
   */
  async createVmFromTemplate(
    vmName: string,
    templateName: string,
  ): Promise<Result<{name: string; node: string; vmid: number}, ServiceError>> {
    // Step 1: Resolve template name to template DTO
    const templateResult = await this.resolveTemplate(templateName);
    if (!templateResult.success) {
      return failure(templateResult.error);
    }

    const template = templateResult.data;

    // Step 2: Allocate next available VMID
    const vmidResult = await this.repository.getNextAvailableVmid();
    if (!vmidResult.success) {
      return failure(
        new ServiceError('Failed to allocate VMID for new VM', {
          cause: vmidResult.error,
        }),
      );
    }

    const newVmid = vmidResult.data;

    // Step 3: Clone template to new VMID
    const cloneResult = await this.repository.cloneFromTemplate(template.node, template.vmid, newVmid, vmName);
    if (!cloneResult.success) {
      return failure(
        new ServiceError('Failed to create VM from template', {
          cause: cloneResult.error,
          context: {
            newVmid,
            template: template.name,
            vmName,
          },
        }),
      );
    }

    const taskUpid = cloneResult.data;

    // Step 4: Wait for clone task to complete
    const waitResult = await this.repository.waitForTask(template.node, taskUpid);
    if (!waitResult.success) {
      return failure(
        new ServiceError('VM creation timed out or failed', {
          cause: waitResult.error,
          context: {
            message: 'The VM may still be created in the background. Check Proxmox web UI for task status.',
            newVmid,
            taskUpid,
            vmName,
          },
        }),
      );
    }

    // Return success with new VM details
    return success({
      name: vmName,
      node: template.node,
      vmid: newVmid,
    });
  }

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

  /**
   * Resolves a template name to a template DTO.
   * Uses case-sensitive matching and returns the first match if multiple templates have the same name.
   * @param templateName Name of the template to resolve
   * @returns Result containing ProxmoxTemplateDTO or an error
   */
  private async resolveTemplate(templateName: string): Promise<Result<ProxmoxTemplateDTO, ServiceError>> {
    // Get all templates from repository
    const templatesResult = await this.repository.listTemplates();

    if (!templatesResult.success) {
      return failure(
        new ServiceError('Failed to retrieve templates', {
          cause: templatesResult.error,
        }),
      );
    }

    // Find template with matching name (case-sensitive)
    const template = templatesResult.data.find((t) => t.name === templateName);

    if (!template) {
      return failure(
        new ServiceError(`Template '${templateName}' not found`, {
          context: {
            availableTemplates: templatesResult.data.map((t) => t.name),
            templateName,
          },
        }),
      );
    }

    return success(template);
  }
}
