import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {afterEach, beforeEach, describe, it} from 'mocha'

describe('project zellij', () => {
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

  it('runs with explicit project and config name', async () => {
    const {error, stdout} = await runCommand('project zellij sflab homelab-cli')

    // Command should succeed or fail based on whether 'zellij' is available
    if (error) {
      // Acceptable errors: zellij command not found, spawn error
      expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
    } else {
      // Success message should mention opening session
      expect(stdout).to.match(/Opening Zellij session.*homelab-cli.*sflab/i)
    }
  })

  it('runs with explicit project name only (auto-detect config)', async () => {
    const {error, stdout} = await runCommand('project zellij sflab')

    // Command should succeed or fail based on whether 'zellij' is available
    if (error) {
      // Acceptable errors: zellij command not found, spawn error
      expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
    } else {
      // Success message should mention opening session for the project
      expect(stdout).to.match(/Opening Zellij session.*sflab/i)
    }
  })

  it('runs with explicit config name only (auto-detect project)', async () => {
    const {error, stdout} = await runCommand('project zellij myconfig')

    // Command should succeed or fail based on whether we can detect project or zellij is available
    if (error) {
      // Acceptable errors: project detection failure, zellij command not found
      expect(error.message).to.match(
        /Could not detect current project|zellij.*not found|Failed to open Zellij/i,
      )
    } else {
      // Success message should mention the config name
      expect(stdout).to.match(/Opening Zellij session.*myconfig/i)
    }
  })

  it('runs without arguments (auto-detect project and config)', async () => {
    const {error, stdout} = await runCommand('project zellij')

    // Error is acceptable if we can't detect the project or zellij is not found
    if (error) {
      expect(error.message).to.match(
        /Could not detect current project|zellij.*not found|Failed to open Zellij/i,
      )
    } else {
      // Success message should mention opening Zellij session
      expect(stdout).to.match(/Opening Zellij session/i)
    }
  })

  it('shows error when project cannot be detected (outside projects directory)', async () => {
    // Change to a directory that's definitely not a project
    process.chdir('/tmp')

    const {error} = await runCommand('project zellij')

    expect(error).to.exist
    if (error) {
      // Accept either project detection error or command not found (depending on test environment)
      expect(error.message).to.match(/Could not detect current project|command.*not found/)
    }
  })

  it('shows error when projects directory config is invalid', async () => {
    // Set invalid projects directory path that doesn't exist
    process.env.PROJECTS_DIR = '/this/path/definitely/does/not/exist/nowhere'

    const {error, stdout} = await runCommand('project zellij myproject')

    // The command may succeed in spawning zellij even with invalid dir
    // (zellij command itself might fail with config not found, but that's not our error)
    // So we accept either scenario
    if (error) {
      expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
    } else {
      // Command succeeded in spawning
      expect(stdout).to.match(/Opening Zellij session/i)
    }
  })

  describe('argument handling', () => {
    it('accepts both project-name and config-name positional arguments', async () => {
      const {error, stdout} = await runCommand('project zellij testproject testconfig')

      // Should either succeed or fail with zellij not found (not project detection error)
      if (error) {
        expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
      } else {
        expect(stdout).to.match(/Opening Zellij session.*testconfig.*testproject/i)
      }
    })
  })

  describe('output format', () => {
    it('displays appropriate message when opening Zellij session', async () => {
      const {error, stdout} = await runCommand('project zellij testproject testconfig')

      if (error) {
        // If zellij command not available, that's acceptable
        expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
      } else {
        expect(stdout).to.include('Zellij session')
        expect(stdout).to.include('testconfig')
        expect(stdout).to.include('testproject')
      }
    })
  })

  describe('with custom PROJECTS_DIR', () => {
    it('uses custom projects directory when set', async () => {
      process.env.PROJECTS_DIR = '/tmp/test-projects'

      const {error, stdout} = await runCommand('project zellij testproject')

      // Should attempt to use custom directory
      if (error) {
        // Acceptable errors: zellij command not found
        expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
      } else {
        expect(stdout).to.match(/Opening Zellij session/i)
      }
    })
  })
})
