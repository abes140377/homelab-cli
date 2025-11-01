import {type RepositoryError} from '../../errors/repository.error.js';
import {type ProjectDTO} from '../../models/project.dto.js';
import {type Result} from '../../utils/result.js';

/**
 * Interface for project repository.
 * Defines the contract for project data access operations.
 */
export interface IProjectRepository {
  /**
   * Retrieves all projects for a specific workspace.
   * @param workspaceName - The name of the workspace to find projects for
   * @returns Result containing array of projects or an error
   */
  findByWorkspaceName(workspaceName: string): Promise<Result<ProjectDTO[], RepositoryError>>;
}
