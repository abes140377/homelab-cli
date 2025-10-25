import {RepositoryError} from '../errors/repository.error.js';
import {type WorkspaceDTO} from '../models/workspace.dto.js';
import {type Result, success} from '../utils/result.js';
import {type IWorkspaceRepository} from './interfaces/workspace.repository.interface.js';

/**
 * Mock implementation of workspace repository.
 * Provides in-memory mock data for development without requiring a database.
 */
export class WorkspaceRepository implements IWorkspaceRepository {
  private readonly mockData: WorkspaceDTO[] = [
    {
      createdAt: new Date('2024-01-15T10:00:00Z'),
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'production',
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      createdAt: new Date('2024-01-20T14:30:00Z'),
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'staging',
      updatedAt: new Date('2024-02-01T09:15:00Z'),
    },
    {
      createdAt: new Date('2024-02-01T08:00:00Z'),
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'development',
      updatedAt: new Date('2024-02-10T16:45:00Z'),
    },
  ];

  /**
   * Retrieves all workspaces from mock data.
   * @returns Result containing array of workspaces
   */
  async findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>> {
    // Return a copy to prevent external mutations
    return success([...this.mockData]);
  }
}
