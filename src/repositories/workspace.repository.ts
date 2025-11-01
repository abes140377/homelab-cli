import PocketBase, {ClientResponseError} from 'pocketbase'

import type {PocketBaseConfig} from '../config/pocketbase.config.js'
import type {WorkspaceDTO} from '../models/workspace.dto.js'
import type {IWorkspaceRepository} from './interfaces/workspace.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {WorkspaceSchema} from '../models/schemas/workspace.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Workspace repository implementation using PocketBase.
 * Fetches workspace data from a PocketBase 'workspaces' collection.
 */
export class WorkspaceRepository implements IWorkspaceRepository {
  private client: PocketBase
  private config: PocketBaseConfig

  constructor(config: PocketBaseConfig) {
    this.config = config
    this.client = new PocketBase(config.url)
  }

  /**
   * Retrieves all workspaces from PocketBase 'workspaces' collection.
   * Authenticates with admin credentials if provided in config.
   * @returns Result containing array of workspaces or a RepositoryError
   */
  async findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>> {
    try {
      // Authenticate if credentials are provided
      if (this.config.adminEmail && this.config.adminPassword) {
        await this.client.admins.authWithPassword(
          this.config.adminEmail,
          this.config.adminPassword,
        )
      }

      // Fetch all records from 'workspaces' collection
      const records = await this.client.collection('workspaces').getFullList()

      // Map and validate PocketBase records to WorkspaceDTO
      const workspaces: WorkspaceDTO[] = records.map((record) => {
        // Map PocketBase record structure to our domain model
        const workspaceData = {
          createdAt: new Date(record.created),
          id: record.id,
          name: record.name,
          updatedAt: new Date(record.updated),
        }

        // Validate with Zod schema
        return WorkspaceSchema.parse(workspaceData)
      })

      return success(workspaces)
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
          `Failed to fetch workspaces from PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * Retrieves a single workspace by name from PocketBase 'workspaces' collection.
   * Expands the 'contexts' relation to include associated contexts.
   * @param name - The name of the workspace to find
   * @returns Result containing the workspace with contexts or a RepositoryError
   */
  async findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>> {
    try {
      // Authenticate if credentials are provided
      if (this.config.adminEmail && this.config.adminPassword) {
        await this.client.admins.authWithPassword(
          this.config.adminEmail,
          this.config.adminPassword,
        )
      }

      // Fetch workspace by name with contexts expanded
      const record = await this.client
        .collection('workspaces')
        .getFirstListItem(`name="${name}"`, {
          expand: 'contexts',
        })

      // Map PocketBase record structure to our domain model
      const workspaceData = {
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
      const workspace = WorkspaceSchema.parse(workspaceData)

      return success(workspace)
    } catch (error) {
      // Handle PocketBase-specific errors
      if (error instanceof ClientResponseError) {
        // Special handling for 404 (workspace not found)
        if (error.status === 404) {
          return failure(
            new RepositoryError(
              `Workspace '${name}' not found`,
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
          `Failed to fetch workspace from PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
