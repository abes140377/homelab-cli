import {loadPocketBaseConfig} from '../config/pocketbase.config.js';
import {ProjectRepository} from '../repositories/project.repository.js';
import {ProjectService} from '../services/project.service.js';

/**
 * Factory for creating project service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ProjectFactory = {
  /**
   * Creates a fully-configured ProjectService instance.
   * @returns ProjectService with all dependencies wired
   */
  createProjectService(): ProjectService {
    const config = loadPocketBaseConfig();
    const repository = new ProjectRepository(config);
    return new ProjectService(repository);
  },
};
