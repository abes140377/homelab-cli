import {loadPocketBaseConfig} from '../config/pocketbase.config.js'
import {loadProjectsDirConfig} from '../config/projects-dir.config.js'
import {ProjectFsRepository} from '../repositories/project-fs.repository.js'
import {ProjectRepository} from '../repositories/project.repository.js'
import {ProjectFsService} from '../services/project-fs.service.js'
import {ProjectService} from '../services/project.service.js'

/**
 * Factory for creating project service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ProjectFactory = {
  /**
   * Creates a fully-configured ProjectFsService instance using filesystem.
   * @returns ProjectFsService with filesystem repository dependencies wired
   */
  createProjectFsService(): ProjectFsService {
    const config = loadProjectsDirConfig()
    const repository = new ProjectFsRepository(config)
    return new ProjectFsService(repository)
  },

  /**
   * Creates a fully-configured ProjectService instance using PocketBase.
   * @returns ProjectService with PocketBase repository dependencies wired
   */
  createProjectService(): ProjectService {
    const config = loadPocketBaseConfig()
    const repository = new ProjectRepository(config)
    return new ProjectService(repository)
  },
}
