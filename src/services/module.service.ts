import type {ModuleDto} from '../models/module.dto.js'
import type {IModuleRepository} from '../repositories/interfaces/module.repository.interface.js'

import {ServiceError} from '../errors/service.error.js'
import {ModuleSchema} from '../models/schemas/module.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Service for module business logic.
 * Orchestrates repository calls and applies validation.
 */
export class ModuleService {
  constructor(private readonly repository: IModuleRepository) {}

  /**
   * Lists all modules for a project from the filesystem.
   * @param projectName - The name of the project to find modules for
   * @returns Result containing array of modules or an error
   */
  async listModules(projectName: string): Promise<Result<ModuleDto[], ServiceError>> {
    const repositoryResult = await this.repository.findByProjectName(projectName)

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve modules from filesystem', {
          cause: repositoryResult.error,
        }),
      )
    }

    // Validate the data using Zod schema (defensive validation)
    const validationResult = ModuleSchema.array().safeParse(repositoryResult.data)

    if (!validationResult.success) {
      return failure(
        new ServiceError('Module data validation failed', {
          zodError: validationResult.error,
        }),
      )
    }

    return success(validationResult.data)
  }
}
