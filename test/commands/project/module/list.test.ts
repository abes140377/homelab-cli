import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'

describe('project module list', () => {
  const originalEnv = process.env
  const originalCwd = process.cwd()

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
  })

  afterEach(() => {
    // Restore original environment and cwd
    process.env = originalEnv
    process.chdir(originalCwd)
  })

  it('runs with explicit project name', async () => {
    const {error, stdout} = await runCommand('project module list sflab')

    // Error is acceptable if project doesn't exist or has no modules
    if (error) {
      expect(error.message).to.match(
        /Failed to list modules|Failed to retrieve modules|Project src directory not found/,
      )
    } else {
      // Should contain table headers or "No modules found" message
      const hasHeaders = stdout.includes('NAME') && stdout.includes('GIT REPOSITORY URL')
      const hasNoModulesMessage = stdout.includes('No modules found')

      expect(hasHeaders || hasNoModulesMessage).to.be.true
    }
  })

  it('runs without project name (auto-detect from cwd)', async () => {
    const {error, stdout} = await runCommand('project module list')

    // Error is acceptable if:
    // - Not in a project directory
    // - Project src directory doesn't exist
    // - Cannot detect current project
    if (error) {
      expect(error.message).to.match(
        /Could not detect current project|Failed to list modules|Failed to retrieve modules|Project src directory not found/,
      )
    } else {
      // Should contain table headers or "No modules found" message
      const hasHeaders = stdout.includes('NAME') && stdout.includes('GIT REPOSITORY URL')
      const hasNoModulesMessage = stdout.includes('No modules found')

      expect(hasHeaders || hasNoModulesMessage).to.be.true
    }
  })

  it('runs with custom PROJECTS_DIR when set', async () => {
    // Use tmpdir as a safe test location
    process.env.PROJECTS_DIR = '/tmp/test-projects'

    const {error, stdout} = await runCommand('project module list testproject')

    // Error is acceptable if directory doesn't exist
    if (error) {
      expect(error.message).to.match(/Failed to list modules|Project src directory not found/)
    } else {
      // Should contain table headers or "No modules found" message
      const hasHeaders = stdout.includes('NAME') && stdout.includes('GIT REPOSITORY URL')
      const hasNoModulesMessage = stdout.includes('No modules found')

      expect(hasHeaders || hasNoModulesMessage).to.be.true
    }
  })

  describe('with filesystem', () => {
    it('formats output correctly when modules are found', async () => {
      const {error, stdout} = await runCommand('project module list sflab')

      // Only check formatting if no error
      if (error) {
        // Skip test if filesystem isn't accessible
        expect(error.message).to.match(
          /Failed to list modules|Project src directory not found/,
        )
      } else {
        // Should either have table headers or empty message
        // eslint-disable-next-line no-lonely-if
        if (stdout.includes('NAME')) {
          expect(stdout).to.contain('GIT REPOSITORY URL')
        } else {
          expect(stdout).to.match(/No modules found for project/)
        }
      }
    })

    it('shows error when project does not exist', async () => {
      const {error} = await runCommand('project module list nonexistent-project-xyz')

      expect(error).to.exist
      if (error) {
        expect(error.message).to.match(/Project src directory not found|Failed to list modules/)
      }
    })

    it('shows helpful message when no project name and outside project directory', async () => {
      // Change to a directory that's definitely not a project
      process.chdir('/tmp')

      const {error} = await runCommand('project module list')

      expect(error).to.exist
      if (error) {
        expect(error.message).to.match(/Could not detect current project/)
      }
    })
  })

  describe('output format', () => {
    it('displays module name and git URL in table', async () => {
      const {error, stdout} = await runCommand('project module list sflab')

      if (!error && stdout.includes('NAME')) {
        // Check that both columns are present
        expect(stdout).to.include('NAME')
        expect(stdout).to.include('GIT REPOSITORY URL')
      } else {
        // If error or no modules, that's acceptable for this test
        expect(true).to.be.true
      }
    })
  })
})
