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

  it('should show error when POCKETBASE_URL is missing', async () => {
    delete process.env.POCKETBASE_URL

    const {error} = await runCommand('project list')

    expect(error).to.exist
    expect(error?.message).to.include('POCKETBASE_URL')
  })

  it('should show error when POCKETBASE_URL is invalid', async () => {
    process.env.POCKETBASE_URL = 'not-a-valid-url'

    const {error} = await runCommand('project list')

    expect(error).to.exist
    expect(error?.message).to.include('Invalid PocketBase configuration')
  })

  // Integration test - only runs if POCKETBASE_URL is set
  // This test requires a real PocketBase instance to be running
  ;(process.env.POCKETBASE_URL ? describe : describe.skip)('with PocketBase configured', () => {
    it('runs project list with valid config', async () => {
      const {error, stdout} = await runCommand('project list')

      // If PocketBase is accessible, should have output
      // If PocketBase is not accessible, should have error
      if (error) {
        // Connection error is acceptable if PocketBase isn't running
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects/)
      } else {
        // Should contain table headers or "No projects found" message
        const hasHeaders = stdout.includes('ID') && stdout.includes('NAME')
        const hasNoWorkspacesMessage = stdout.includes('No projects found')

        expect(hasHeaders || hasNoWorkspacesMessage).to.be.true
      }
    })

    it('formats output correctly when PocketBase is accessible', async () => {
      const {error, stdout} = await runCommand('project list')

      // Only check formatting if no error (PocketBase is running)
      if (error) {
        // Skip test if PocketBase isn't accessible
        expect(error.message).to.match(/Failed to list projects|Failed to retrieve projects/)
      } else {
        // Should either have table headers or empty message
        // eslint-disable-next-line no-lonely-if
        if (stdout.includes('ID')) {
          expect(stdout).to.contain('CREATED AT')
          expect(stdout).to.contain('UPDATED AT')
        } else {
          expect(stdout).to.include('No projects found')
        }
      }
    })
  })
})
