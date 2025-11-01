import {type RepositoryError} from '../../errors/repository.error.js';
import {type WorkspaceDTO} from '../../models/workspace.dto.js';
import {type Result} from '../../utils/result.js';

/**
 * Interface for workspace repository.
 * Defines the contract for workspace data access operations.
 */
export interface IWorkspaceRepository {
  /**
   * Retrieves all workspaces.
   * @returns Result containing array of workspaces or an error
   */
  findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>>;

  /**
   * Retrieves a single workspace by name.
   * @param name - The name of the workspace to find
   * @returns Result containing the workspace or an error
   */
  findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>>;
}
