import {type RepositoryError} from '../../errors/repository.error.js';
import {type ModuleDTO} from '../../models/module.dto.js';
import {type Result} from '../../utils/result.js';

/**
 * Interface for module repository.
 * Defines the contract for module data access operations.
 */
export interface IModuleRepository {
  /**
   * Retrieves all modules for a specific workspace.
   * @param workspaceName - The name of the workspace to find modules for
   * @returns Result containing array of modules or an error
   */
  findByWorkspaceName(workspaceName: string): Promise<Result<ModuleDTO[], RepositoryError>>;
}
