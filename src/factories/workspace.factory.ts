import {loadPocketBaseConfig} from '../config/pocketbase.config.js';
import {WorkspaceRepository} from '../repositories/workspace.repository.js';
import {WorkspaceService} from '../services/workspace.service.js';

/**
 * Factory for creating workspace service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const WorkspaceFactory = {
  /**
   * Creates a fully-configured WorkspaceService instance.
   * @returns WorkspaceService with all dependencies wired
   */
  createWorkspaceService(): WorkspaceService {
    const config = loadPocketBaseConfig();
    const repository = new WorkspaceRepository(config);
    return new WorkspaceService(repository);
  },
};
