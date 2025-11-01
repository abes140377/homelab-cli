import {expect} from 'chai'
import {describe, it} from 'mocha'

import {ProjectSchema} from '../../../src/models/schemas/project.schema.js'

describe('ProjectSchema', () => {
  it('should validate a valid project', () => {
    const validProject = {
      createdAt: new Date('2024-01-01T10:00:00.000Z'),
      description: 'A sample project',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Project 1',
      updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    }

    const result = ProjectSchema.safeParse(validProject)
    expect(result.success).to.be.true
  })

  it('should reject project with missing name', () => {
    const invalidProject = {
      createdAt: new Date(),
      description: 'A sample project',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(invalidProject)
    expect(result.success).to.be.false
  })

  it('should reject project with empty name', () => {
    const invalidProject = {
      createdAt: new Date(),
      description: 'A sample project',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(invalidProject)
    expect(result.success).to.be.false
  })

  it('should accept project with SSH format gitRepoUrl', () => {
    const sshProject = {
      createdAt: new Date(),
      description: 'A sample project',
      gitRepoUrl: 'git@github.com:user/repo.git',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Project 1',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(sshProject)
    expect(result.success).to.be.true
  })

  it('should accept project with HTTP gitRepoUrl', () => {
    const httpProject = {
      createdAt: new Date(),
      description: 'A sample project',
      gitRepoUrl: 'http://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Project 1',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(httpProject)
    expect(result.success).to.be.true
  })

  it('should reject project with invalid gitRepoUrl', () => {
    const invalidProject = {
      createdAt: new Date(),
      description: 'A sample project',
      gitRepoUrl: 'not-a-url',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Project 1',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(invalidProject)
    expect(result.success).to.be.false
  })

  it('should reject project with empty description', () => {
    const invalidProject = {
      createdAt: new Date(),
      description: '',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Project 1',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(invalidProject)
    expect(result.success).to.be.false
  })

  it('should reject project with missing id', () => {
    const invalidProject = {
      createdAt: new Date(),
      description: 'A sample project',
      gitRepoUrl: 'https://github.com/user/repo',
      name: 'Project 1',
      updatedAt: new Date(),
    }

    const result = ProjectSchema.safeParse(invalidProject)
    expect(result.success).to.be.false
  })
})
