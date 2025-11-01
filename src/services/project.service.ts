import {ServiceError} from '../errors/service.error.js';
import {type ProjectDTO} from '../models/project.dto.js';
import {ProjectSchema} from '../models/schemas/project.schema.js';
import {type IProjectRepository} from '../repositories/interfaces/project.repository.interface.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for project business logic.
 * Orchestrates repository calls and applies validation.
 */
export class ProjectService {
  constructor(private readonly repository: IProjectRepository) {}

  /**
   * Lists all projects for a specific workspace.
   * @param workspaceName - The name of the workspace to find projects for
   * @returns Result containing array of projects or an error
   */
  async listProjects(workspaceName: string): Promise<Result<ProjectDTO[], ServiceError>> {
    const repositoryResult = await this.repository.findByWorkspaceName(workspaceName);

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve projects from repository', {
          cause: repositoryResult.error,
        }),
      );
    }

    // Validate the data using Zod schema (defensive validation)
    const validationResult = ProjectSchema.array().safeParse(repositoryResult.data);

    if (!validationResult.success) {
      return failure(
        new ServiceError('Project data validation failed', {
          zodError: validationResult.error,
        }),
      );
    }

    return success(validationResult.data);
  }
}
