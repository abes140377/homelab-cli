import type {RepositoryError} from '../../errors/repository.error.js'
import type {ProjectFsDto} from '../../models/project-fs.dto.js'
import type {Result} from '../../utils/result.js'

/**
 * Interface for filesystem-based project repository.
 * Defines the contract for project data access operations from filesystem.
 */
export interface IProjectFsRepository {
  /**
   * Retrieves all projects from filesystem.
   * @returns Result containing array of projects or an error
   */
  findAll(): Promise<Result<ProjectFsDto[], RepositoryError>>

  /**
   * Retrieves a single project by name from filesystem.
   * @param name - The name of the project to find
   * @returns Result containing the project or an error
   */
  findByName(name: string): Promise<Result<ProjectFsDto, RepositoryError>>
}
