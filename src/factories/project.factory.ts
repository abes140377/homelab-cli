import {getCliConfig} from '../config/cli.config.js'
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
    const cliConfig = getCliConfig()
    const config = {projectsDir: cliConfig.get('projectsDir')}
    const repository = new ProjectRepository(config)
    return new ProjectService(repository)
  },
}
