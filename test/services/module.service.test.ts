import { expect } from 'chai';

import { RepositoryError } from '../../src/errors/repository.error.js';
import { type ModuleDTO } from '../../src/models/module.dto.js';
import { type IModuleRepository } from '../../src/repositories/interfaces/module.repository.interface.js';
import { ModuleService } from '../../src/services/module.service.js';
import { failure, type Result, success } from '../../src/utils/result.js';

/**
 * Mock repository implementation for testing
 */
class MockModuleRepository implements IModuleRepository {
  private mockData: Map<string, Result<ModuleDTO[], RepositoryError>> = new Map();

  async findByWorkspaceName(workspaceName: string): Promise<Result<ModuleDTO[], RepositoryError>> {
    return this.mockData.get(workspaceName) || success([]);
  }

  setMockData(workspaceName: string, result: Result<ModuleDTO[], RepositoryError>): void {
    this.mockData.set(workspaceName, result);
  }
}

describe('ModuleService', () => {
  let mockRepository: MockModuleRepository;
  let service: ModuleService;

  const validModules: ModuleDTO[] = [
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
    mockRepository = new MockModuleRepository();
    service = new ModuleService(mockRepository);
  });

  describe('listModules', () => {
    it('should return success when repository returns valid modules', async () => {
      mockRepository.setMockData('production', success(validModules));

      const result = await service.listModules('production');

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.deep.equal(validModules);
      }
    });

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Database connection failed');
      mockRepository.setMockData('production', failure(repositoryError));

      const result = await service.listModules('production');

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message).to.contain('Failed to retrieve modules');
      }
    });

    it('should handle empty module array', async () => {
      mockRepository.setMockData('empty-workspace', success([]));

      const result = await service.listModules('empty-workspace');

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.be.an('array').that.is.empty;
      }
    });

    it('should validate module data using Zod schema', async () => {
      // Valid modules should pass
      mockRepository.setMockData('production', success(validModules));

      const result = await service.listModules('production');

      expect(result.success).to.be.true;
    });

    it('should fail validation for invalid module data', async () => {
      // Create invalid data (missing required fields)
      const invalidModules = [
        {
          createdAt: 'invalid-date',
          description: '',
          gitRepoUrl: 'not-a-url',
          id: '',
          name: '',
          updatedAt: 'invalid-date',
        },
      ] as unknown as ModuleDTO[];

      mockRepository.setMockData('production', success(invalidModules));

      const result = await service.listModules('production');

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed');
      }
    });

    it('should handle different workspace names', async () => {
      const workspace1Modules = [validModules[0]];
      const workspace2Modules = [validModules[1]];

      mockRepository.setMockData('workspace1', success(workspace1Modules));
      mockRepository.setMockData('workspace2', success(workspace2Modules));

      const result1 = await service.listModules('workspace1');
      const result2 = await service.listModules('workspace2');

      expect(result1.success).to.be.true;
      expect(result2.success).to.be.true;

      if (result1.success && result2.success) {
        expect(result1.data).to.deep.equal(workspace1Modules);
        expect(result2.data).to.deep.equal(workspace2Modules);
      }
    });
  });
});
