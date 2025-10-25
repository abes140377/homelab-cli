import {expect} from 'chai';

import {RepositoryError} from '../../src/errors/repository.error.js';
import {type WorkspaceDTO} from '../../src/models/workspace.dto.js';
import {type IWorkspaceRepository} from '../../src/repositories/interfaces/workspace.repository.interface.js';
import {WorkspaceService} from '../../src/services/workspace.service.js';
import {failure, type Result, success} from '../../src/utils/result.js';

/**
 * Mock repository implementation for testing
 */
class MockWorkspaceRepository implements IWorkspaceRepository {
  private mockData: Result<WorkspaceDTO[], RepositoryError>;

  constructor(mockResult?: Result<WorkspaceDTO[], RepositoryError>) {
    this.mockData = mockResult || success([]);
  }

  async findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>> {
    return this.mockData;
  }

  setMockData(result: Result<WorkspaceDTO[], RepositoryError>): void {
    this.mockData = result;
  }
}

describe('WorkspaceService', () => {
  let mockRepository: MockWorkspaceRepository;
  let service: WorkspaceService;

  const validWorkspaces: WorkspaceDTO[] = [
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
  ];

  beforeEach(() => {
    mockRepository = new MockWorkspaceRepository();
    service = new WorkspaceService(mockRepository);
  });

  describe('listWorkspaces', () => {
    it('should return success when repository returns valid workspaces', async () => {
      mockRepository.setMockData(success(validWorkspaces));

      const result = await service.listWorkspaces();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.deep.equal(validWorkspaces);
      }
    });

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      mockRepository.setMockData(failure(repositoryError));

      const result = await service.listWorkspaces();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message).to.contain('Failed to retrieve workspaces');
      }
    });

    it('should handle empty workspace array', async () => {
      mockRepository.setMockData(success([]));

      const result = await service.listWorkspaces();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.an('array').that.is.empty;
      }
    });

    it('should validate workspace data using Zod schema', async () => {
      // Valid workspaces should pass
      mockRepository.setMockData(success(validWorkspaces));

      const result = await service.listWorkspaces();

      expect(result.success).to.be.true;
    });

    it('should fail validation for invalid workspace data', async () => {
      // Create invalid data (missing required fields)
      const invalidWorkspaces = [
        {
          createdAt: 'invalid-date',
          id: 'not-a-uuid',
          name: '',
          updatedAt: 'invalid-date',
        },
      ] as unknown as WorkspaceDTO[];

      mockRepository.setMockData(success(invalidWorkspaces));

      const result = await service.listWorkspaces();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed');
      }
    });
  });
});
