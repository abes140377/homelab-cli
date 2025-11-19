import {expect} from 'chai'

import type {ProjectDto} from '../../src/models/project.dto.js'
import type {IProjectRepository} from '../../src/repositories/interfaces/project.repository.interface.js'

import {RepositoryError} from '../../src/errors/repository.error.js'
import {ProjectService} from '../../src/services/project.service.js'
import {failure, type Result, success} from '../../src/utils/result.js'

/**
 * Mock repository implementation for testing
 */
class MockProjectRepository implements IProjectRepository {
  private mockData: Result<ProjectDto[], RepositoryError>
  private mockFindByNameData: null | Result<ProjectDto, RepositoryError> = null

  constructor(mockResult?: Result<ProjectDto[], RepositoryError>) {
    this.mockData = mockResult || success([])
  }

  async findAll(): Promise<Result<ProjectDto[], RepositoryError>> {
    return this.mockData
  }

  async findByName(_name: string): Promise<Result<ProjectDto, RepositoryError>> {
    if (this.mockFindByNameData) {
      return this.mockFindByNameData
    }

    return failure(new RepositoryError('Not implemented in mock'))
  }

  setMockData(result: Result<ProjectDto[], RepositoryError>): void {
    this.mockData = result
  }

  setMockFindByNameData(result: Result<ProjectDto, RepositoryError>): void {
    this.mockFindByNameData = result
  }
}

describe('ProjectService', () => {
  let mockRepository: MockProjectRepository
  let service: ProjectService

  const validProjects: ProjectDto[] = [
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
    mockRepository = new MockProjectRepository()
    service = new ProjectService(mockRepository)
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
      ] as unknown as ProjectDto[]

      mockRepository.setMockData(success(invalidProjects))

      const result = await service.listProjects()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed')
      }
    })

    it('should handle projects with empty gitRepoUrl', async () => {
      const projectsWithEmptyUrl: ProjectDto[] = [
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
      } as unknown as ProjectDto

      mockRepository.setMockFindByNameData(success(invalidProject))

      const result = await service.findProjectByName('invalid')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('validation failed')
      }
    })
  })
})
