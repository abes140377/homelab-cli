import type {RepositoryError} from '../../errors/repository.error.js'
import type {ModuleDto} from '../../models/module.dto.js'
import type {Result} from '../../utils/result.js'

/**
 * Interface for module repository.
 * Defines the contract for module data access operations.
 */
export interface IModuleRepository {
  /**
   * Retrieves all modules for a project.
   * @param projectName - The name of the project to find modules for
   * @returns Result containing array of modules or an error
   */
  findByProjectName(projectName: string): Promise<Result<ModuleDto[], RepositoryError>>
}
