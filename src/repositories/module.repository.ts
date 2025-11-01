import PocketBase, {ClientResponseError} from 'pocketbase'

import type {PocketBaseConfig} from '../config/pocketbase.config.js'
import type {ModuleDTO} from '../models/module.dto.js'
import type {IModuleRepository} from './interfaces/module.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {ModuleSchema} from '../models/schemas/module.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Module repository implementation using PocketBase.
 * Fetches module data from a PocketBase 'projects' collection.
 */
export class ModuleRepository implements IModuleRepository {
  private client: PocketBase
  private config: PocketBaseConfig

  constructor(config: PocketBaseConfig) {
    this.config = config
    this.client = new PocketBase(config.url)
  }

  /**
   * Retrieves all modules for a specific workspace from PocketBase.
   * First fetches the workspace by name, then retrieves its associated modules.
   * Authenticates with admin credentials if provided in config.
   * @param workspaceName - The name of the workspace to find modules for
   * @returns Result containing array of modules or a RepositoryError
   */
  async findByWorkspaceName(workspaceName: string): Promise<Result<ModuleDTO[], RepositoryError>> {
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

      // Extract expanded modules from the workspace record
      const moduleRecords = workspaceRecord.expand?.['projects(workspace)'] || []

      // Handle empty module list
      if (!Array.isArray(moduleRecords) || moduleRecords.length === 0) {
        return success([])
      }

      // Map and validate PocketBase records to ModuleDTO
      const modules: ModuleDTO[] = moduleRecords.map((record: {
        created: string
        description: string
        gitRepoUrl: string
        id: string
        name: string
        updated: string
      }) => {
        // Map PocketBase record structure to our domain model
        const moduleData = {
          createdAt: new Date(record.created),
          description: record.description,
          gitRepoUrl: record.gitRepoUrl,
          id: record.id,
          name: record.name,
          updatedAt: new Date(record.updated),
        }

        // Validate with Zod schema
        return ModuleSchema.parse(moduleData)
      })

      return success(modules)
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
          `Failed to fetch modules from PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
