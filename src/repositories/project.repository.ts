import PocketBase, {ClientResponseError} from 'pocketbase'

import type {PocketBaseConfig} from '../config/pocketbase.config.js'
import type {ProjectDTO} from '../models/project.dto.js'
import type {IProjectRepository} from './interfaces/project.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {ProjectSchema} from '../models/schemas/project.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Project repository implementation using PocketBase.
 * Fetches project data from a PocketBase 'projects' collection.
 */
export class ProjectRepository implements IProjectRepository {
  private client: PocketBase
  private config: PocketBaseConfig

  constructor(config: PocketBaseConfig) {
    this.config = config
    this.client = new PocketBase(config.url)
  }

  /**
   * Retrieves all projects from PocketBase 'projects' collection.
   * Authenticates with admin credentials if provided in config.
   * @returns Result containing array of projects or a RepositoryError
   */
  async findAll(): Promise<Result<ProjectDTO[], RepositoryError>> {
    try {
      // Authenticate if credentials are provided
      if (this.config.adminEmail && this.config.adminPassword) {
        await this.client.admins.authWithPassword(
          this.config.adminEmail,
          this.config.adminPassword,
        )
      }

      // Fetch all records from 'projects' collection
      const records = await this.client.collection('projects').getFullList()

      // Map and validate PocketBase records to ProjectDTO
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projects: ProjectDTO[] = records.map((record: any) => {
        // Map PocketBase record structure to our domain model
        const projectData = {
          createdAt: new Date(record.created),
          id: record.id,
          name: record.name,
          updatedAt: new Date(record.updated),
        }

        // Validate with Zod schema
        return ProjectSchema.parse(projectData)
      })

      return success(projects)
    } catch (error: unknown) {
      // Handle PocketBase-specific errors
      if (error instanceof ClientResponseError) {
        return failure(
          new RepositoryError(
            `PocketBase API error (${(error as ClientResponseError).status}): ${(error as ClientResponseError).message}`,
            {
              cause: error as Error,
              context: {
                message: (error as ClientResponseError).message,
                status: (error as ClientResponseError).status,
                url: (error as ClientResponseError).url,
              },
            },
          ),
        )
      }

      // Handle generic errors (network, validation, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return failure(
        new RepositoryError(
          `Failed to fetch projects from PocketBase: ${errorMessage}`,
          {
            cause: error instanceof Error ? error : undefined,
            context: {
              message: error instanceof Error ? error.message : String(error),
            },
          },
        ),
      )
    }
  }

  /**
   * Retrieves a single project by name from PocketBase 'projects' collection.
   * Expands the 'contexts' relation to include associated contexts.
   * @param name - The name of the project to find
   * @returns Result containing the project with contexts or a RepositoryError
   */
  async findByName(name: string): Promise<Result<ProjectDTO, RepositoryError>> {
    try {
      // Authenticate if credentials are provided
      if (this.config.adminEmail && this.config.adminPassword) {
        await this.client.admins.authWithPassword(
          this.config.adminEmail,
          this.config.adminPassword,
        )
      }

      // Fetch project by name with contexts expanded
      const record = await this.client
        .collection('projects')
        .getFirstListItem(`name="${name}"`, {
          expand: 'contexts',
        })

      // Map PocketBase record structure to our domain model
      const projectData = {
        contexts: record.expand?.contexts?.map((ctx: {created: string; id: string; name: string; updated: string}) => ({
          createdAt: new Date(ctx.created),
          id: ctx.id,
          name: ctx.name,
          updatedAt: new Date(ctx.updated),
        })) || [],
        createdAt: new Date(record.created),
        id: record.id,
        name: record.name,
        updatedAt: new Date(record.updated),
      }

      // Validate with Zod schema
      const project = ProjectSchema.parse(projectData)

      return success(project)
    } catch (error: unknown) {
      // Handle PocketBase-specific errors
      if (error instanceof ClientResponseError) {
        const clientError = error as ClientResponseError
        // Special handling for 404 (project not found)
        if (clientError.status === 404) {
          return failure(
            new RepositoryError(
              `Project '${name}' not found`,
              {
                cause: error as Error,
                context: {
                  message: clientError.message,
                  name,
                  status: clientError.status,
                },
              },
            ),
          )
        }

        return failure(
          new RepositoryError(
            `PocketBase API error (${clientError.status}): ${clientError.message}`,
            {
              cause: error as Error,
              context: {
                message: clientError.message,
                name,
                status: clientError.status,
                url: clientError.url,
              },
            },
          ),
        )
      }

      // Handle generic errors (network, validation, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return failure(
        new RepositoryError(
          `Failed to fetch project from PocketBase: ${errorMessage}`,
          {
            cause: error instanceof Error ? error : undefined,
            context: {
              message: error instanceof Error ? error.message : String(error),
              name,
            },
          },
        ),
      )
    }
  }
}
