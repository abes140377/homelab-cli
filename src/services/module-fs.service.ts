import type {ModuleFsDto} from '../models/module-fs.dto.js'
import type {IModuleFsRepository} from '../repositories/interfaces/module-fs.repository.interface.js'

import {ServiceError} from '../errors/service.error.js'
import {ModuleFsSchema} from '../models/schemas/module-fs.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Service for module business logic using filesystem repository.
 * Orchestrates filesystem repository calls and applies validation.
 */
export class ModuleFsService {
  constructor(private readonly repository: IModuleFsRepository) {}

  /**
   * Lists all modules for a project from the filesystem.
   * @param projectName - The name of the project to find modules for
   * @returns Result containing array of modules or an error
   */
  async listModules(projectName: string): Promise<Result<ModuleFsDto[], ServiceError>> {
    const repositoryResult = await this.repository.findByProjectName(projectName)

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve modules from filesystem', {
          cause: repositoryResult.error,
        }),
      )
    }

    // Validate the data using Zod schema (defensive validation)
    const validationResult = ModuleFsSchema.array().safeParse(repositoryResult.data)

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
