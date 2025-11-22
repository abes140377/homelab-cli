import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'
import {mkdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import type {ProjectsDirConfig} from '../../src/config/projects-dir.config.js'

import {ModuleRepository} from '../../src/repositories/module.repository.js'

describe('ModuleRepository', () => {
  let repository: ModuleRepository
  let config: ProjectsDirConfig
  let testDir: string

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `test-projects-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`)
    await mkdir(testDir, {recursive: true})

    config = {
      projectsDir: testDir,
    }

    repository = new ModuleRepository(config)
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, {force: true, recursive: true})
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('findByProjectName', () => {
    it('should return success Result with Git repositories from project src', async () => {
      // Create test project with modules
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      await mkdir(join(projectSrcDir, 'module1', '.git'), {recursive: true})
      await mkdir(join(projectSrcDir, 'module2', '.git'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(2)
        const names = result.data.map((m) => m.name).sort()
        expect(names).to.deep.equal(['module1', 'module2'])
        expect(result.data[0]).to.have.property('name')
        expect(result.data[0]).to.have.property('gitRepoUrl')
        expect(result.data[0].gitRepoUrl).to.be.a('string')
      }
    })

    it('should exclude hidden directories', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      await mkdir(join(projectSrcDir, 'module1', '.git'), {recursive: true})
      await mkdir(join(projectSrcDir, '.hidden', '.git'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].name).to.equal('module1')
      }
    })

    it('should exclude directories without .git', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      await mkdir(join(projectSrcDir, 'git-module', '.git'), {recursive: true})
      await mkdir(join(projectSrcDir, 'not-git-module'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].name).to.equal('git-module')
      }
    })

    it('should return empty array when no Git repositories found in src', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      await mkdir(join(projectSrcDir, 'folder1'), {recursive: true})
      await mkdir(join(projectSrcDir, 'folder2'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(0)
      }
    })

    it('should return empty array when src directory is empty', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      await mkdir(projectSrcDir, {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(0)
      }
    })

    it('should return failure when project src directory does not exist', async () => {
      const projectName = 'nonexistent'

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('Project src directory not found')
      }
    })

    it('should return failure when project exists but src directory does not', async () => {
      const projectName = 'testproject'

      // Create project directory but not src subdirectory
      await mkdir(join(testDir, projectName), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.contain('Project src directory not found')
      }
    })

    it('should handle modules with empty gitRepoUrl', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      // Create a git repo without remote
      await mkdir(join(projectSrcDir, 'local-module', '.git'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].name).to.equal('local-module')
        expect(result.data[0].gitRepoUrl).to.equal('')
      }
    })

    it('should not scan subdirectories of a found Git repository', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      // Create module at root level of src
      await mkdir(join(projectSrcDir, 'root-module', '.git'), {recursive: true})

      // Create nested git repo (should not be detected because parent is already a git repo)
      await mkdir(join(projectSrcDir, 'root-module', 'nested', '.git'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        // Should only find root-module, not nested (stops scanning subdirs when git repo found)
        expect(result.data).to.have.lengthOf(1)
        expect(result.data[0].name).to.equal('root-module')
      }
    })

    it('should recursively scan subdirectories for Git repositories', async () => {
      const projectName = 'testproject'
      const projectSrcDir = join(testDir, projectName, 'src')

      // Create modules at different nesting levels
      await mkdir(join(projectSrcDir, 'top-level', '.git'), {recursive: true})
      await mkdir(join(projectSrcDir, 'frontend', 'ui', '.git'), {recursive: true})
      await mkdir(join(projectSrcDir, 'backend', 'api', 'services', '.git'), {recursive: true})
      await mkdir(join(projectSrcDir, 'libs', 'shared', '.git'), {recursive: true})

      const result = await repository.findByProjectName(projectName)

      expect(result.success).to.be.true
      if (result.success) {
        expect(result.data).to.have.lengthOf(4)
        const names = result.data.map((m) => m.name).sort()
        expect(names).to.deep.equal([
          'backend/api/services',
          'frontend/ui',
          'libs/shared',
          'top-level',
        ])
      }
    })
  })
})
