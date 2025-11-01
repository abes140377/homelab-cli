import {expect} from 'chai'
import {describe, it} from 'mocha'

import {ModuleSchema} from '../../../src/models/schemas/module.schema.js'

describe('ModuleSchema', () => {
  it('should validate a valid module', () => {
    const validModule = {
      createdAt: new Date('2024-01-01T10:00:00.000Z'),
      description: 'A sample module',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Module 1',
      updatedAt: new Date('2024-01-01T10:00:00.000Z'),
    }

    const result = ModuleSchema.safeParse(validModule)
    expect(result.success).to.be.true
  })

  it('should reject module with missing name', () => {
    const invalidModule = {
      createdAt: new Date(),
      description: 'A sample module',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(invalidModule)
    expect(result.success).to.be.false
  })

  it('should reject module with empty name', () => {
    const invalidModule = {
      createdAt: new Date(),
      description: 'A sample module',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(invalidModule)
    expect(result.success).to.be.false
  })

  it('should accept module with SSH format gitRepoUrl', () => {
    const sshModule = {
      createdAt: new Date(),
      description: 'A sample module',
      gitRepoUrl: 'git@github.com:user/repo.git',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Module 1',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(sshModule)
    expect(result.success).to.be.true
  })

  it('should accept module with HTTP gitRepoUrl', () => {
    const httpModule = {
      createdAt: new Date(),
      description: 'A sample module',
      gitRepoUrl: 'http://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Module 1',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(httpModule)
    expect(result.success).to.be.true
  })

  it('should reject module with invalid gitRepoUrl', () => {
    const invalidModule = {
      createdAt: new Date(),
      description: 'A sample module',
      gitRepoUrl: 'not-a-url',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Module 1',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(invalidModule)
    expect(result.success).to.be.false
  })

  it('should reject module with empty description', () => {
    const invalidModule = {
      createdAt: new Date(),
      description: '',
      gitRepoUrl: 'https://github.com/user/repo',
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Module 1',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(invalidModule)
    expect(result.success).to.be.false
  })

  it('should reject module with missing id', () => {
    const invalidModule = {
      createdAt: new Date(),
      description: 'A sample module',
      gitRepoUrl: 'https://github.com/user/repo',
      name: 'Module 1',
      updatedAt: new Date(),
    }

    const result = ModuleSchema.safeParse(invalidModule)
    expect(result.success).to.be.false
  })
})
