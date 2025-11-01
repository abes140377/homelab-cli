import {loadPocketBaseConfig} from '../config/pocketbase.config.js'
import {WorkspaceRepository} from '../repositories/workspace.repository.js'
import {WorkspaceService} from '../services/workspace.service.js'

/**
 * Factory for creating workspace service instances with PocketBase repository.
 * Centralizes PocketBase configuration loading and dependency composition.
 */
export const PocketBaseWorkspaceFactory = {
  /**
   * Creates a fully-configured WorkspaceService instance with PocketBase repository.
   * Loads configuration from environment variables and wires dependencies.
   * @returns WorkspaceService with PocketBase repository
   * @throws Error if POCKETBASE_URL is missing or configuration is invalid
   */
  createWorkspaceService(): WorkspaceService {
    const config = loadPocketBaseConfig()
    const repository = new WorkspaceRepository(config)
    return new WorkspaceService(repository)
  },
}
