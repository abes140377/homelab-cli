import {loadPocketBaseConfig} from '../config/pocketbase.config.js'
import {ProjectRepository} from '../repositories/project.repository.js'
import {ProjectService} from '../services/project.service.js'

/**
 * Factory for creating project service instances with PocketBase repository.
 * Centralizes PocketBase configuration loading and dependency composition.
 */
export const PocketBaseProjectFactory = {
  /**
   * Creates a fully-configured ProjectService instance with PocketBase repository.
   * Loads configuration from environment variables and wires dependencies.
   * @returns ProjectService with PocketBase repository
   * @throws Error if POCKETBASE_URL is missing or configuration is invalid
   */
  createProjectService(): ProjectService {
    const config = loadPocketBaseConfig()
    const repository = new ProjectRepository(config)
    return new ProjectService(repository)
  },
}
