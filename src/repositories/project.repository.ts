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
      const projects: ProjectDTO[] = records.map((record) => {
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
    } catch (error) {
      // Handle PocketBase-specific errors
      if (error instanceof ClientResponseError) {
        return failure(
          new RepositoryError(
            `PocketBase API error (${error.status}): ${error.message}`,
            {
              cause: error,
              context: {
                message: error.message,
                status: error.status,
                url: error.url,
              },
            },
          ),
        )
      }

      // Handle generic errors (network, validation, etc.)
      return failure(
        new RepositoryError(
          `Failed to fetch projects from PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    } catch (error) {
      // Handle PocketBase-specific errors
      if (error instanceof ClientResponseError) {
        // Special handling for 404 (project not found)
        if (error.status === 404) {
          return failure(
            new RepositoryError(
              `Project '${name}' not found`,
              {
                cause: error,
                context: {
                  message: error.message,
                  name,
                  status: error.status,
                },
              },
            ),
          )
        }

        return failure(
          new RepositoryError(
            `PocketBase API error (${error.status}): ${error.message}`,
            {
              cause: error,
              context: {
                message: error.message,
                name,
                status: error.status,
                url: error.url,
              },
            },
          ),
        )
      }

      // Handle generic errors (network, validation, etc.)
      return failure(
        new RepositoryError(
          `Failed to fetch project from PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
