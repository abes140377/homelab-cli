import {ServiceError} from '../errors/service.error.js';
import {WorkspaceSchema} from '../models/schemas/workspace.schema.js';
import {type WorkspaceDTO} from '../models/workspace.dto.js';
import {type IWorkspaceRepository} from '../repositories/interfaces/workspace.repository.interface.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for workspace business logic.
 * Orchestrates repository calls and applies validation.
 */
export class WorkspaceService {
  constructor(private readonly repository: IWorkspaceRepository) {}

  /**
   * Finds a workspace by name.
   * @param name - The name of the workspace to find
   * @returns Result containing the workspace or an error
   */
  async findWorkspaceByName(name: string): Promise<Result<WorkspaceDTO, ServiceError>> {
    const repositoryResult = await this.repository.findByName(name);

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve workspace from repository', {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema (defensive validation)
    const validationResult = WorkspaceSchema.safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('Workspace data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    return success(validationResult.data);
  }

  /**
   * Lists all workspaces.
   * @returns Result containing array of workspaces or an error
   */
  async listWorkspaces(): Promise<Result<WorkspaceDTO[], ServiceError>> {
    const repositoryResult = await this.repository.findAll();

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve workspaces from repository', {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema
    const validationResult = WorkspaceSchema.array().safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('Workspace data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    return success(validationResult.data);
  }
}
