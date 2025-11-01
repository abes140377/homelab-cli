import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'
import {restore, type SinonStub, stub} from 'sinon'

import type {PocketBaseConfig} from '../../src/config/pocketbase.config.js'

import {ProjectRepository} from '../../src/repositories/project.repository.js'

describe('ProjectRepository', () => {
  let repository: ProjectRepository
  let config: PocketBaseConfig
  let clientStub: {
    admins: {authWithPassword: SinonStub}
    collection: SinonStub
  }

  beforeEach(() => {
    config = {
      url: 'http://127.0.0.1:8090',
    }

    // Create mock PocketBase client
    clientStub = {
      admins: {
        authWithPassword: stub().resolves(),
      },
      collection: stub(),
    }

    repository = new ProjectRepository(config)
    // Replace the internal client with our stub
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(repository as any).client = clientStub
  })

  afterEach(() => {
    restore()
  })

  describe('findAll', () => {
    it('should return success Result with projects', async () => {
      const mockRecords = [
        {
          created: '2024-01-01T10:00:00.000Z',
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Project1',
          updated: '2024-01-01T10:00:00.000Z',
        },
      ]

      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves(mockRecords),
      })

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].id).to.equal('550e8400-e29b-41d4-a716-446655440000')
        expect(result.data[0].name).to.equal('Project1')
        expect(result.data[0].createdAt).to.be.instanceOf(Date)
        expect(result.data[0].updatedAt).to.be.instanceOf(Date)
      }
    })

    it('should map PocketBase record fields correctly', async () => {
      const mockRecords = [
        {
          created: '2024-01-15T14:30:00.000Z',
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Workspace',
          updated: '2024-01-16T10:00:00.000Z',
        },
      ]

      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves(mockRecords),
      })

      const result = await repository.findAll()

      if (result.success) {
        const project = result.data[0]
        expect(project.id).to.equal('123e4567-e89b-12d3-a456-426614174000')
        expect(project.name).to.equal('Test Workspace')
        expect(project.createdAt.toISOString()).to.equal('2024-01-15T14:30:00.000Z')
        expect(project.updatedAt.toISOString()).to.equal('2024-01-16T10:00:00.000Z')
      }
    })

    it('should authenticate when credentials are provided', async () => {
      const configWithAuth: PocketBaseConfig = {
        adminEmail: 'admin@example.com',
        adminPassword: 'password123',
        url: 'http://127.0.0.1:8090',
      }

      repository = new ProjectRepository(configWithAuth)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(repository as any).client = clientStub

      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves([]),
      })

      await repository.findAll()

      expect(clientStub.admins.authWithPassword.calledOnce).to.be.true
      expect(
        clientStub.admins.authWithPassword.calledWith('admin@example.com', 'password123'),
      ).to.be.true
    })

    it('should not authenticate when credentials are not provided', async () => {
      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves([]),
      })

      await repository.findAll()

      expect(clientStub.admins.authWithPassword.called).to.be.false
    })

    it('should return empty array when collection is empty', async () => {
      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves([]),
      })

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(0)
      }
    })

    it('should return failure Result on connection error', async () => {
      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().rejects(new Error('Connection refused')),
      })

      const result = await repository.findAll()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('Failed to fetch projects from PocketBase')
        expect(result.error.message).to.include('Connection refused')
      }
    })

    it('should return failure Result on authentication error', async () => {
      const configWithAuth: PocketBaseConfig = {
        adminEmail: 'admin@example.com',
        adminPassword: 'wrong-password',
        url: 'http://127.0.0.1:8090',
      }

      repository = new ProjectRepository(configWithAuth)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(repository as any).client = clientStub

      clientStub.admins.authWithPassword.rejects(new Error('Invalid credentials'))

      const result = await repository.findAll()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('Failed to fetch projects from PocketBase')
        expect(result.error.message).to.include('Invalid credentials')
      }
    })

    it('should handle ClientResponseError with status code', async () => {
      const {ClientResponseError} = await import('pocketbase')
      const error = new ClientResponseError({
        data: {},
        message: 'Collection not found',
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        response: {} as Response,
        status: 404,
        url: 'http://127.0.0.1:8090/api/collections/projects/records',
      })

      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().rejects(error),
      })

      const result = await repository.findAll()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('PocketBase API error (404)')
      }
    })

    it('should return failure Result when data validation fails', async () => {
      const invalidRecords = [
        {
          created: '2024-01-01T10:00:00.000Z',
          id: '', // Invalid: empty ID
          name: 'Project1',
          updated: '2024-01-01T10:00:00.000Z',
        },
      ]

      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves(invalidRecords),
      })

      const result = await repository.findAll()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('Failed to fetch projects from PocketBase')
      }
    })

    it('should handle multiple projects', async () => {
      const mockRecords = [
        {
          created: '2024-01-01T10:00:00.000Z',
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Project1',
          updated: '2024-01-01T10:00:00.000Z',
        },
        {
          created: '2024-01-02T10:00:00.000Z',
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Project2',
          updated: '2024-01-02T10:00:00.000Z',
        },
        {
          created: '2024-01-03T10:00:00.000Z',
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Project3',
          updated: '2024-01-03T10:00:00.000Z',
        },
      ]

      clientStub.collection.withArgs('projects').returns({
        getFullList: stub().resolves(mockRecords),
      })

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(3)
        expect(result.data[0].name).to.equal('Project1')
        expect(result.data[1].name).to.equal('Project2')
        expect(result.data[2].name).to.equal('Project3')
      }
    })
  })
})
