import {ServiceError} from '../errors/service.error.js';
import {type ProxmoxTemplateDTO} from '../models/proxmox-template.dto.js';
import {ProxmoxTemplateSchema} from '../models/schemas/proxmox-template.schema.js';
import {type IProxmoxRepository} from '../repositories/interfaces/proxmox.repository.interface.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for Proxmox template business logic.
 * Orchestrates repository calls, applies validation, and sorting.
 */
export class ProxmoxTemplateService {
  constructor(private readonly repository: IProxmoxRepository) {}

  /**
   * Lists all Proxmox templates, sorted by VMID ascending.
   * @returns Result containing array of templates or an error
   */
  async listTemplates(): Promise<Result<ProxmoxTemplateDTO[], ServiceError>> {
    const repositoryResult = await this.repository.listTemplates();

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve templates from Proxmox', {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema
    const validationResult = ProxmoxTemplateSchema.array().safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('Template data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    // Sort templates by vmid ascending
    const sortedTemplates = validationResult.data.sort((a, b) => a.vmid - b.vmid);

    return success(sortedTemplates);
  }
}
