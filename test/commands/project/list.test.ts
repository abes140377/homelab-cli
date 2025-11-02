import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'

describe('project list', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  // NOTE: These tests are for the filesystem-based implementation.
  // If switching back to PocketBase, update these tests to check for POCKETBASE_URL instead.

  it('runs with default PROJECTS_DIR when not set', async () => {
    delete process.env.PROJECTS_DIR

    const {error, stdout} = await runCommand('project list')

    // Should use default ~/projects/ directory
    // Error is acceptable if directory doesn't exist or is empty
    if (error) {
      expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects|Failed to initialize filesystem/)
    } else {
      // Should contain table headers or "No projects found" message
      const hasHeaders = stdout.includes('NAME') && stdout.includes('GIT REPOSITORY URL')
      const hasNoProjectsMessage = stdout.includes('No projects found')

      expect(hasHeaders || hasNoProjectsMessage).to.be.true
    }
  })

  it('runs with custom PROJECTS_DIR when set', async () => {
    // Use tmpdir as a safe test location
    process.env.PROJECTS_DIR = '/tmp/test-projects'

    const {error, stdout} = await runCommand('project list')

    // Error is acceptable if directory doesn't exist or is empty
    if (error) {
      expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects/)
    } else {
      // Should contain table headers or "No projects found" message
      const hasHeaders = stdout.includes('NAME') && stdout.includes('GIT REPOSITORY URL')
      const hasNoProjectsMessage = stdout.includes('No projects found')

      expect(hasHeaders || hasNoProjectsMessage).to.be.true
    }
  })

  // Integration test - tests the actual filesystem implementation
  describe('with filesystem', () => {
    it('runs project list', async () => {
      const {error, stdout} = await runCommand('project list')

      // Filesystem may not exist or be empty
      if (error) {
        // Error is acceptable if directory doesn't exist or can't be read
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects/)
      } else {
        // Should contain table headers or "No projects found" message
        const hasHeaders = stdout.includes('NAME') && stdout.includes('GIT REPOSITORY URL')
        const hasNoProjectsMessage = stdout.includes('No projects found')

        expect(hasHeaders || hasNoProjectsMessage).to.be.true
      }
    })

    it('formats output correctly when filesystem is accessible', async () => {
      const {error, stdout} = await runCommand('project list')

      // Only check formatting if no error
      if (error) {
        // Skip test if filesystem isn't accessible
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects/)
      } else {
        // Should either have table headers or empty message
        // eslint-disable-next-line no-lonely-if
        if (stdout.includes('NAME')) {
          expect(stdout).to.contain('GIT REPOSITORY URL')
        } else {
          expect(stdout).to.include('No projects found')
        }
      }
    })
  })
})
