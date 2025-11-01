import {ServiceError} from '../errors/service.error.js';
import {type ModuleDTO} from '../models/module.dto.js';
import {ModuleSchema} from '../models/schemas/module.schema.js';
import {type IModuleRepository} from '../repositories/interfaces/module.repository.interface.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for module business logic.
 * Orchestrates repository calls and applies validation.
 */
export class ModuleService {
  constructor(private readonly repository: IModuleRepository) {}

  /**
   * Lists all modules for a specific workspace.
   * @param workspaceName - The name of the workspace to find modules for
   * @returns Result containing array of modules or an error
   */
  async listModules(workspaceName: string): Promise<Result<ModuleDTO[], ServiceError>> {
    const repositoryResult = await this.repository.findByWorkspaceName(workspaceName);

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve modules from repository', {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema (defensive validation)
    const validationResult = ModuleSchema.array().safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('Module data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    return success(validationResult.data);
  }
}
