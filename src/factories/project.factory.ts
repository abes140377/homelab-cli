import {loadProjectsDirConfig} from '../config/projects-dir.config.js'
import {ProjectRepository} from '../repositories/project.repository.js'
import {ProjectService} from '../services/project.service.js'

/**
 * Factory for creating project service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ProjectFactory = {
  /**
   * Creates a fully-configured ProjectService instance.
   * @returns ProjectService with repository dependencies wired
   */
  createProjectService(): ProjectService {
    const config = loadProjectsDirConfig()
    const repository = new ProjectRepository(config)
    return new ProjectService(repository)
  },
}
