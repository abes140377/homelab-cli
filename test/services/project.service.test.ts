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
  private mockData: Result<ProjectDTO[], RepositoryError>;

  constructor(mockResult?: Result<ProjectDTO[], RepositoryError>) {
    this.mockData = mockResult || success([]);
  }

  async findAll(): Promise<Result<ProjectDTO[], RepositoryError>> {
    return this.mockData;
  }

  setMockData(result: Result<ProjectDTO[], RepositoryError>): void {
    this.mockData = result;
  }
}

describe('ProjectService', () => {
  let mockRepository: MockProjectRepository;
  let service: ProjectService;

  const validProjects: ProjectDTO[] = [
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
    mockRepository = new MockProjectRepository();
    service = new ProjectService(mockRepository);
  });

  describe('listProjects', () => {
    it('should return success when repository returns valid projects', async () => {
      mockRepository.setMockData(success(validProjects));

      const result = await service.listProjects();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.deep.equal(validProjects);
      }
    });

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      mockRepository.setMockData(failure(repositoryError));

      const result = await service.listProjects();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message).to.contain('Failed to retrieve projects');
      }
    });

    it('should handle empty project array', async () => {
      mockRepository.setMockData(success([]));

      const result = await service.listProjects();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.an('array').that.is.empty;
      }
    });

    it('should validate project data using Zod schema', async () => {
      // Valid projects should pass
      mockRepository.setMockData(success(validProjects));

      const result = await service.listProjects();

      expect(result.success).to.be.true;
    });

    it('should fail validation for invalid project data', async () => {
      // Create invalid data (missing required fields)
      const invalidProjects = [
        {
          createdAt: 'invalid-date',
          id: 'not-a-uuid',
          name: '',
          updatedAt: 'invalid-date',
        },
      ] as unknown as ProjectDTO[];

      mockRepository.setMockData(success(invalidProjects));

      const result = await service.listProjects();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed');
      }
    });
  });
});
