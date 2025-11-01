import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'

describe('workspace vscode', () => {
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

    const {error} = await runCommand('workspace vscode test-workspace test-context')

    expect(error).to.exist
    expect(error?.message).to.include('POCKETBASE_URL')
  })

  it('should show error when POCKETBASE_URL is invalid', async () => {
    process.env.POCKETBASE_URL = 'not-a-valid-url'

    const {error} = await runCommand('workspace vscode test-workspace test-context')

    expect(error).to.exist
    expect(error?.message).to.include('Invalid PocketBase configuration')
  })

  it('should show error when workspace-name argument is missing', async () => {
    const {error} = await runCommand('workspace vscode')

    expect(error).to.exist
    expect(error?.message).to.match(/Missing \d+ required arg/)
  })

  it('should show error when context-name argument is missing', async () => {
    const {error} = await runCommand('workspace vscode test-workspace')

    expect(error).to.exist
    expect(error?.message).to.match(/Missing \d+ required arg/)
  })

  // Integration tests - only run if POCKETBASE_URL is set
  // These tests require a real PocketBase instance with workspace data
  ;(process.env.POCKETBASE_URL ? describe : describe.skip)('with PocketBase configured', () => {
    it('should show error for non-existent workspace', async () => {
      const {error} = await runCommand('workspace vscode non-existent-workspace some-context')

      expect(error).to.exist
      expect(error?.message).to.include('not found')
      expect(error?.message).to.include('homelab workspace list')
    })

    // Note: The following tests would require actual workspace data in PocketBase
    // They are skipped by default but can be enabled for manual integration testing

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should show error when workspace has no contexts', async () => {
      // Requires a workspace with no contexts in PocketBase
      const {error} = await runCommand('workspace vscode workspace-no-contexts some-context')

      expect(error).to.exist
      expect(error?.message).to.include('No contexts found')
      expect(error?.message).to.include('Please configure contexts in PocketBase')
    })

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should show error for non-existent context', async () => {
      // Requires a workspace with contexts in PocketBase
      const {error} = await runCommand('workspace vscode real-workspace non-existent-context')

      expect(error).to.exist
      expect(error?.message).to.include('not found')
      expect(error?.message).to.include('Available contexts:')
    })

    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should launch VSCode with valid workspace and context', async () => {
      // Requires:
      // 1. A workspace named 'test-workspace' in PocketBase
      // 2. A context named 'test-context' for that workspace
      // 3. A file at ~/projects/test-workspace/test-context.code-workspace
      // 4. VSCode CLI installed
      const {error, stdout} = await runCommand('workspace vscode test-workspace test-context')

      if (error) {
        // If error occurs, it should be about VSCode not being installed or file not found
        expect(error.message).to.match(/Failed to launch VSCode|Workspace file not found/)
      } else {
        expect(stdout).to.include('Opened workspace')
        expect(stdout).to.include('test-workspace')
        expect(stdout).to.include('test-context')
        expect(stdout).to.include('VSCode')
      }
    })
  })
})
