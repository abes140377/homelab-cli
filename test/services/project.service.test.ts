import {expect} from 'chai';

import {RepositoryError} from '../../src/errors/repository.error.js';
import {type ProjectDTO} from '../../src/models/project.dto.js';
import {type IProjectRepository} from '../../src/repositories/interfaces/project.repository.interface.js';
import {ProjectService} from '../../src/services/project.service.js';
import {failure, type Result, success} from '../../src/utils/result.js';

/**
 * Mock repository implementation for testing
 */
class MockProjectRepository implements IProjectRepository {
  private mockData: Map<string, Result<ProjectDTO[], RepositoryError>> = new Map();

  async findByWorkspaceName(workspaceName: string): Promise<Result<ProjectDTO[], RepositoryError>> {
    return this.mockData.get(workspaceName) || success([]);
  }

  setMockData(workspaceName: string, result: Result<ProjectDTO[], RepositoryError>): void {
    this.mockData.set(workspaceName, result);
  }
}

describe('ProjectService', () => {
  let mockRepository: MockProjectRepository;
  let service: ProjectService;

  const validProjects: ProjectDTO[] = [
    {
      createdAt: new Date('2024-01-15T10:00:00Z'),
      description: 'Main application repository',
      gitRepoUrl: 'https://github.com/user/app',
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'app',
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    },
    {
      createdAt: new Date('2024-01-20T14:30:00Z'),
      description: 'API service repository',
      gitRepoUrl: 'https://github.com/user/api',
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'api',
      updatedAt: new Date('2024-02-01T09:15:00Z'),
    },
  ];

  beforeEach(() => {
    mockRepository = new MockProjectRepository();
    service = new ProjectService(mockRepository);
  });

  describe('listProjects', () => {
    it('should return success when repository returns valid projects', async () => {
      mockRepository.setMockData('production', success(validProjects));

      const result = await service.listProjects('production');

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.deep.equal(validProjects);
      }
    });

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      mockRepository.setMockData('production', failure(repositoryError));

      const result = await service.listProjects('production');

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message).to.contain('Failed to retrieve projects');
      }
    });

    it('should handle empty project array', async () => {
      mockRepository.setMockData('empty-workspace', success([]));

      const result = await service.listProjects('empty-workspace');

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.an('array').that.is.empty;
      }
    });

    it('should validate project data using Zod schema', async () => {
      // Valid projects should pass
      mockRepository.setMockData('production', success(validProjects));

      const result = await service.listProjects('production');

      expect(result.success).to.be.true;
    });

    it('should fail validation for invalid project data', async () => {
      // Create invalid data (missing required fields)
      const invalidProjects = [
        {
          createdAt: 'invalid-date',
          description: '',
          gitRepoUrl: 'not-a-url',
          id: '',
          name: '',
          updatedAt: 'invalid-date',
        },
      ] as unknown as ProjectDTO[];

      mockRepository.setMockData('production', success(invalidProjects));

      const result = await service.listProjects('production');

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed');
      }
    });

    it('should handle different workspace names', async () => {
      const workspace1Projects = [validProjects[0]];
      const workspace2Projects = [validProjects[1]];

      mockRepository.setMockData('workspace1', success(workspace1Projects));
      mockRepository.setMockData('workspace2', success(workspace2Projects));

      const result1 = await service.listProjects('workspace1');
      const result2 = await service.listProjects('workspace2');

      expect(result1.success).to.be.true;
      expect(result2.success).to.be.true;

      if (result1.success && result2.success) {
        expect(result1.data).to.deep.equal(workspace1Projects);
        expect(result2.data).to.deep.equal(workspace2Projects);
      }
    });
  });
});
