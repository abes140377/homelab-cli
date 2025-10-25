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
    const repository = new WorkspaceRepository();
    return new WorkspaceService(repository);
  },
};
