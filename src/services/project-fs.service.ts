import type {ProjectFsDto} from '../models/project-fs.dto.js'
import type {IProjectFsRepository} from '../repositories/interfaces/project-fs.repository.interface.js'

import {ServiceError} from '../errors/service.error.js'
import {ProjectFsSchema} from '../models/schemas/project-fs.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Service for project business logic using filesystem repository.
 * Orchestrates filesystem repository calls and applies validation.
 */
export class ProjectFsService {
  constructor(private readonly repository: IProjectFsRepository) {}

  /**
   * Finds a project by name from the filesystem.
   * @param name - The name of the project to find
   * @returns Result containing the project or an error
   */
  async findProjectByName(name: string): Promise<Result<ProjectFsDto, ServiceError>> {
    const repositoryResult = await this.repository.findByName(name)

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve project from filesystem', {
          cause: repositoryResult.error,
        }),
      )
    }

    // Validate the data using Zod schema (defensive validation)
    const validationResult = ProjectFsSchema.safeParse(repositoryResult.data)

    if (!validationResult.success) {
      return failure(
        new ServiceError('Project data validation failed', {
          zodError: validationResult.error,
        }),
      )
    }

    return success(validationResult.data)
  }

  /**
   * Lists all projects from the filesystem.
   * @returns Result containing array of projects or an error
   */
  async listProjects(): Promise<Result<ProjectFsDto[], ServiceError>> {
    const repositoryResult = await this.repository.findAll()

    if (!repositoryResult.success) {
      return failure(
        new ServiceError('Failed to retrieve projects from filesystem', {
          cause: repositoryResult.error,
        }),
      )
    }

    // Validate the data using Zod schema
    const validationResult = ProjectFsSchema.array().safeParse(repositoryResult.data)

    if (!validationResult.success) {
      return failure(
        new ServiceError('Project data validation failed', {
          zodError: validationResult.error,
        }),
      )
    }

    return success(validationResult.data)
  }
}
