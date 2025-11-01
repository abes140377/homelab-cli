import {type RepositoryError} from '../../errors/repository.error.js';
import {type ProjectDTO} from '../../models/project.dto.js';
import {type Result} from '../../utils/result.js';

/**
 * Interface for project repository.
 * Defines the contract for project data access operations.
 */
export interface IProjectRepository {
  /**
   * Retrieves all projects.
   * @returns Result containing array of projects or an error
   */
  findAll(): Promise<Result<ProjectDTO[], RepositoryError>>;

  /**
   * Retrieves a single project by name.
   * @param name - The name of the project to find
   * @returns Result containing the project or an error
   */
  findByName(name: string): Promise<Result<ProjectDTO, RepositoryError>>;
}
