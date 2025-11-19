import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'
import {mkdir, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import type {ProjectsDirConfig} from '../../src/config/projects-dir.config.js'

import {ProjectRepository} from '../../src/repositories/project.repository.js'

describe('ProjectRepository', () => {
  let repository: ProjectRepository
  let config: ProjectsDirConfig
  let testDir: string

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `test-projects-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
    await mkdir(testDir, {recursive: true})

    config = {
      projectsDir: testDir,
    }

    repository = new ProjectRepository(config)
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, {force: true, recursive: true})
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('findAll', () => {
    it('should return success Result with Git repositories', async () => {
      // Create test Git repositories with .git/config files
      await mkdir(join(testDir, 'project1', '.git'), {recursive: true})
      await mkdir(join(testDir, 'project2', '.git'), {recursive: true})
      await writeFile(join(testDir, 'file.txt'), 'not a directory')

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(2)
        const names = result.data.map((p) => p.name).sort()
        expect(names).to.deep.equal(['project1', 'project2'])
        expect(result.data[0]).to.have.property('name')
        expect(result.data[0]).to.have.property('gitRepoUrl')
        expect(result.data[0].gitRepoUrl).to.be.a('string')
      }
    })

    it('should exclude hidden directories', async () => {
      // Create test directories
      await mkdir(join(testDir, 'project1', '.git'), {recursive: true})
      await mkdir(join(testDir, '.hidden', '.git'), {recursive: true})

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].name).to.equal('project1')
      }
    })

    it('should exclude directories without .git', async () => {
      // Create one Git project and one regular directory
      await mkdir(join(testDir, 'git-project', '.git'), {recursive: true})
      await mkdir(join(testDir, 'not-git-project'), {recursive: true})

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].name).to.equal('git-project')
      }
    })

    it('should return empty array when no Git repositories found', async () => {
      // Create directories without .git
      await mkdir(join(testDir, 'folder1'), {recursive: true})
      await mkdir(join(testDir, 'folder2'), {recursive: true})

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(0)
      }
    })

    it('should return empty array when projects directory is empty', async () => {
      // testDir is already empty from beforeEach
      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(0)
      }
    })

    it('should return failure Result when projects directory does not exist', async () => {
      // Create repository with non-existent directory
      const badConfig = {projectsDir: join(testDir, 'nonexistent')}
      const badRepository = new ProjectRepository(badConfig)

      const result = await badRepository.findAll()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('Failed to list projects from filesystem')
      }
    })

    it('should return empty string for gitRepoUrl when no remote is configured', async () => {
      await mkdir(join(testDir, 'project1', '.git'), {recursive: true})

      const result = await repository.findAll()

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].gitRepoUrl).to.equal('')
      }
    })
  })

  describe('findByName', () => {
    it('should return success Result with project when found', async () => {
      await mkdir(join(testDir, 'myproject', '.git'), {recursive: true})

      const result = await repository.findByName('myproject')

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data.name).to.equal('myproject')
        expect(result.data).to.have.property('gitRepoUrl')
        expect(result.data.gitRepoUrl).to.be.a('string')
      }
    })

    it('should return failure Result when project does not exist', async () => {
      const result = await repository.findByName('nonexistent')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include("Project 'nonexistent' not found")
      }
    })

    it('should return failure Result when path is not a directory', async () => {
      await writeFile(join(testDir, 'file.txt'), 'not a directory')

      const result = await repository.findByName('file.txt')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include("'file.txt' is not a directory")
      }
    })

    it('should return failure Result when directory is not a Git repository', async () => {
      await mkdir(join(testDir, 'project1'), {recursive: true})

      const result = await repository.findByName('project1')

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('is not a Git repository')
      }
    })

    it('should return empty string for gitRepoUrl when no remote is configured', async () => {
      await mkdir(join(testDir, 'project1', '.git'), {recursive: true})

      const result = await repository.findByName('project1')

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data.gitRepoUrl).to.equal('')
      }
    })
  })
})
