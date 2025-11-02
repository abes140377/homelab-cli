import {expect} from 'chai'

import type {ProjectFsDto} from '../../src/models/project-fs.dto.js'
import type {IProjectFsRepository} from '../../src/repositories/interfaces/project-fs.repository.interface.js'

import {RepositoryError} from '../../src/errors/repository.error.js'
import {ProjectFsService} from '../../src/services/project-fs.service.js'
import {failure, type Result, success} from '../../src/utils/result.js'

/**
 * Mock repository implementation for testing
 */
class MockProjectFsRepository implements IProjectFsRepository {
  private mockData: Result<ProjectFsDto[], RepositoryError>
  private mockFindByNameData: null | Result<ProjectFsDto, RepositoryError> = null

  constructor(mockResult?: Result<ProjectFsDto[], RepositoryError>) {
    this.mockData = mockResult || success([])
  }

  async findAll(): Promise<Result<ProjectFsDto[], RepositoryError>> {
    return this.mockData
  }

  async findByName(_name: string): Promise<Result<ProjectFsDto, RepositoryError>> {
    if (this.mockFindByNameData) {
      return this.mockFindByNameData
    }

    return failure(new RepositoryError('Not implemented in mock'))
  }

  setMockData(result: Result<ProjectFsDto[], RepositoryError>): void {
    this.mockData = result
  }

  setMockFindByNameData(result: Result<ProjectFsDto, RepositoryError>): void {
    this.mockFindByNameData = result
  }
}

describe('ProjectFsService', () => {
  let mockRepository: MockProjectFsRepository
  let service: ProjectFsService

  const validProjects: ProjectFsDto[] = [
    {
      gitRepoUrl: 'git@github.com:user/production.git',
      name: 'production',
    },
    {
      gitRepoUrl: 'git@github.com:user/staging.git',
      name: 'staging',
    },
  ]

  beforeEach(() => {
    mockRepository = new MockProjectFsRepository()
    service = new ProjectFsService(mockRepository)
  })

  describe('listProjects', () => {
    it('should return success when repository returns valid projects', async () => {
      mockRepository.setMockData(success(validProjects))

      const result = await service.listProjects()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.deep.equal(validProjects)
      }
    })

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Filesystem read failed')
      mockRepository.setMockData(failure(repositoryError))

      const result = await service.listProjects()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error)
        expect(result.error.message).to.contain('Failed to retrieve projects')
      }
    })

    it('should handle empty project array', async () => {
      mockRepository.setMockData(success([]))

      const result = await service.listProjects()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.be.an('array').that.is.empty
      }
    })

    it('should validate project data using Zod schema', async () => {
      // Valid projects should pass
      mockRepository.setMockData(success(validProjects))

      const result = await service.listProjects()

      expect(result.success).to.be.true
    })

    it('should fail validation for invalid project data', async () => {
      // Create invalid data (empty name)
      const invalidProjects = [
        {
          gitRepoUrl: 'some-url',
          name: '',
        },
      ] as unknown as ProjectFsDto[]

      mockRepository.setMockData(success(invalidProjects))

      const result = await service.listProjects()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed')
      }
    })

    it('should handle projects with empty gitRepoUrl', async () => {
      const projectsWithEmptyUrl: ProjectFsDto[] = [
        {
          gitRepoUrl: '',
          name: 'local-project',
        },
      ]

      mockRepository.setMockData(success(projectsWithEmptyUrl))

      const result = await service.listProjects()

      // Empty string is now allowed by schema
      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data[0].gitRepoUrl).to.equal('')
      }
    })
  })

  describe('findProjectByName', () => {
    it('should return success when repository finds project', async () => {
      const project = validProjects[0]
      mockRepository.setMockFindByNameData(success(project))

      const result = await service.findProjectByName('production')

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.deep.equal(project)
      }
    })

    it('should return failure when repository returns error', async () => {
      const repositoryError = new RepositoryError('Project not found')
      mockRepository.setMockFindByNameData(failure(repositoryError))

      const result = await service.findProjectByName('nonexistent')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error).to.be.instanceOf(Error)
        expect(result.error.message).to.contain('Failed to retrieve project')
      }
    })

    it('should validate project data using Zod schema', async () => {
      const project = validProjects[0]
      mockRepository.setMockFindByNameData(success(project))

      const result = await service.findProjectByName('production')

      expect(result.success).to.be.true
    })

    it('should fail validation for invalid project data', async () => {
      const invalidProject = {
        gitRepoUrl: 'some-url',
        name: '', // Empty name is invalid
      } as unknown as ProjectFsDto

      mockRepository.setMockFindByNameData(success(invalidProject))

      const result = await service.findProjectByName('invalid')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed')
      }
    })
  })
})
