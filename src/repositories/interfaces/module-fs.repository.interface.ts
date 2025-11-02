import type {RepositoryError} from '../../errors/repository.error.js'
import type {ModuleFsDto} from '../../models/module-fs.dto.js'
import type {Result} from '../../utils/result.js'

/**
 * Interface for filesystem-based module repository.
 * Defines the contract for module data access operations from filesystem.
 */
export interface IModuleFsRepository {
  /**
   * Retrieves all modules for a project from filesystem.
   * @param projectName - The name of the project to find modules for
   * @returns Result containing array of modules or an error
   */
  findByProjectName(projectName: string): Promise<Result<ModuleFsDto[], RepositoryError>>
}
