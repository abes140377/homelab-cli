import {expect} from 'chai'

import {detectCurrentProject} from '../../src/utils/detect-current-project.js'

describe('detectCurrentProject', () => {
  describe('successful detection', () => {
    it('should detect project from module directory', () => {
      const cwd = '/Users/user/projects/sflab/src/homelab-cli'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.equal('sflab')
    })

    it('should detect project from nested subdirectory', () => {
      const cwd = '/Users/user/projects/myproject/src/some-module/deep/nested'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.equal('myproject')
    })

    it('should detect project from project root', () => {
      const cwd = '/Users/user/projects/testproject'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.equal('testproject')
    })

    it('should detect project with different path separators (normalized)', () => {
      const cwd = '/Users/user/projects/myproject/src'
      const projectsDir = '/Users/user/projects/'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.equal('myproject')
    })
  })

  describe('detection failure', () => {
    it('should return null when working directory is outside projects structure', () => {
      const cwd = '/tmp/somewhere'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.be.null
    })

    it('should return null when at projects root', () => {
      const cwd = '/Users/user/projects'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.be.null
    })

    it('should return null when working directory is parent of projects directory', () => {
      const cwd = '/Users/user'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.be.null
    })

    it('should return null when paths do not match at all', () => {
      const cwd = '/home/otheruser/code'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.be.null
    })
  })

  describe('edge cases', () => {
    it('should handle trailing slashes in projectsDir', () => {
      const cwd = '/Users/user/projects/myproject/src'
      const projectsDir = '/Users/user/projects/'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.equal('myproject')
    })

    it('should handle paths without trailing slashes', () => {
      const cwd = '/Users/user/projects/myproject'
      const projectsDir = '/Users/user/projects'

      const result = detectCurrentProject(cwd, projectsDir)

      expect(result).to.equal('myproject')
    })
  })
})
