import {expect} from 'chai'

import type {ModuleFsDto} from '../../src/models/module-fs.dto.js'
import type {IModuleFsRepository} from '../../src/repositories/interfaces/module-fs.repository.interface.js'

import {RepositoryError} from '../../src/errors/repository.error.js'
import {ModuleFsService} from '../../src/services/module-fs.service.js'
import {failure, type Result, success} from '../../src/utils/result.js'

/**
 * Mock repository implementation for testing
 */
class MockModuleFsRepository implements IModuleFsRepository {
  private mockData: Result<ModuleFsDto[], RepositoryError>

  constructor(mockResult?: Result<ModuleFsDto[], RepositoryError>) {
    this.mockData = mockResult || success([])
  }

  async findByProjectName(_projectName: string): Promise<Result<ModuleFsDto[], RepositoryError>> {
    return this.mockData
  }

  setMockData(result: Result<ModuleFsDto[], RepositoryError>): void {
    this.mockData = result
  }
}

describe('ModuleFsService', () => {
  let mockRepository: MockModuleFsRepository
  let service: ModuleFsService

  const validModules: ModuleFsDto[] = [
    {
      gitRepoUrl: 'git@github.com:user/module1.git',
      name: 'module1',
    },
    {
      gitRepoUrl: 'git@github.com:user/module2.git',
      name: 'module2',
    },
  ]

  beforeEach(() => {
    mockRepository = new MockModuleFsRepository()
    service = new ModuleFsService(mockRepository)
  })

  describe('listModules', () => {
    it('should return success when repository returns valid modules', async () => {
      mockRepository.setMockData(success(validModules))

      const result = await service.listModules('testproject')

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.deep.equal(validModules)
      }
    })

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Project src directory not found')
      mockRepository.setMockData(failure(repositoryError))

      const result = await service.listModules('testproject')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error)
        expect(result.error.message).to.contain('Failed to retrieve modules')
      }
    })

    it('should handle empty module array', async () => {
      mockRepository.setMockData(success([]))

      const result = await service.listModules('testproject')

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.be.an('array').that.is.empty
      }
    })

    it('should validate module data using Zod schema', async () => {
      // Valid modules should pass
      mockRepository.setMockData(success(validModules))

      const result = await service.listModules('testproject')

      expect(result.success).to.be.true
    })

    it('should fail validation for invalid module data', async () => {
      // Create invalid data (empty name)
      const invalidModules = [
        {
          gitRepoUrl: 'some-url',
          name: '',
        },
      ] as unknown as ModuleFsDto[]

      mockRepository.setMockData(success(invalidModules))

      const result = await service.listModules('testproject')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed')
      }
    })

    it('should handle modules with empty gitRepoUrl', async () => {
      const modulesWithEmptyUrl: ModuleFsDto[] = [
        {
          gitRepoUrl: '',
          name: 'local-module',
        },
      ]

      mockRepository.setMockData(success(modulesWithEmptyUrl))

      const result = await service.listModules('testproject')

      // Empty string is allowed by schema
      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data[0].gitRepoUrl).to.equal('')
      }
    })
  })
})
