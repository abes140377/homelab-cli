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
   * Retrieves all projects for a specific workspace from PocketBase.
   * First fetches the workspace by name, then retrieves its associated projects.
   * Authenticates with admin credentials if provided in config.
   * @param workspaceName - The name of the workspace to find projects for
   * @returns Result containing array of projects or a RepositoryError
   */
  async findByWorkspaceName(workspaceName: string): Promise<Result<ProjectDTO[], RepositoryError>> {
    try {
      // Authenticate if credentials are provided
      if (this.config.adminEmail && this.config.adminPassword) {
        await this.client.admins.authWithPassword(
          this.config.adminEmail,
          this.config.adminPassword,
        )
      }

      // Fetch workspace by name with projects expanded
      const workspaceRecord = await this.client
        .collection('workspaces')
        .getFirstListItem(`name="${workspaceName}"`, {
          expand: 'projects(workspace)',
        })

      // Extract expanded projects from the workspace record
      const projectRecords = workspaceRecord.expand?.['projects(workspace)'] || []

      // Handle empty project list
      if (!Array.isArray(projectRecords) || projectRecords.length === 0) {
        return success([])
      }

      // Map and validate PocketBase records to ProjectDTO
      const projects: ProjectDTO[] = projectRecords.map((record: {
        created: string
        description: string
        gitRepoUrl: string
        id: string
        name: string
        updated: string
      }) => {
        // Map PocketBase record structure to our domain model
        const projectData = {
          createdAt: new Date(record.created),
          description: record.description,
          gitRepoUrl: record.gitRepoUrl,
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
        // Special handling for 404 (workspace not found)
        if (error.status === 404) {
          return failure(
            new RepositoryError(
              `Workspace '${workspaceName}' not found`,
              {
                cause: error,
                context: {
                  message: error.message,
                  status: error.status,
                  workspaceName,
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
                status: error.status,
                url: error.url,
                workspaceName,
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
              workspaceName,
            },
          },
        ),
      )
    }
  }
}
