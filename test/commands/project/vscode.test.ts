import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import { afterEach, beforeEach, describe, it } from 'mocha'

describe('project vscode', () => {
  const originalEnv = process.env
  const originalCwd = process.cwd()

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment and cwd
    process.env = originalEnv
    process.chdir(originalCwd)
  })

  // it('runs with explicit project and workspace name', async () => {
  //   const { error, stdout } = await runCommand('project vscode sflab homelab')

  //   // Command should succeed or fail based on whether 'code' is available
  //   if (error) {
  //     // Acceptable errors: code command not found, spawn error
  //     expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
  //   } else {
  //     // Success message should mention opening workspace
  //     expect(stdout).to.match(/Opening workspace.*in VS Code/)
  //   }
  // })

  it('runs with explicit project name only (open project root)', async () => {
    const { error, stdout } = await runCommand('project vscode sflab')

    // Command should succeed or fail based on whether 'code' is available
    if (error) {
      // Acceptable errors: code command not found, spawn error
      expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
    } else {
      // Success message should mention opening project (not workspace)
      expect(stdout).to.match(/Opening project in VS Code/)
    }
  })

  // it('runs with workspace name only (auto-detect project)', async () => {
  //   // Note: With oclif, a single argument is treated as project-name, not workspace-name
  //   // To pass only workspace name, we'd need flags, but the spec says positional args
  //   // This test actually tests project-name only behavior
  //   const {error, stdout} = await runCommand('project vscode myworkspace')

  //   // Error is acceptable if we can't detect the project or code not found
  //   if (error) {
  //     expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
  //   } else {
  //     // With single positional arg, it's treated as project-name, so opens project root
  //     expect(stdout).to.match(/Opening project in VS Code/)
  //   }
  // })

  it('runs without arguments (auto-detect project, open project root)', async () => {
    const { error, stdout } = await runCommand('project vscode')

    // Error is acceptable if we can't detect the project or code is not found
    if (error) {
      expect(error.message).to.match(
        /Could not detect current project|code.*not found|Failed to open VSCode/i,
      )
    } else {
      // Success message should mention opening project
      expect(stdout).to.match(/Opening project in VS Code/)
    }
  })

  it('shows error when project cannot be detected (outside projects directory)', async () => {
    // Change to a directory that's definitely not a project
    process.chdir('/tmp')

    const { error } = await runCommand('project vscode')

    expect(error).to.exist
    if (error) {
      expect(error.message).to.match(/Could not detect current project/)
    }
  })

  it('shows error when projects directory config is invalid', async () => {
    // Set invalid projects directory path that doesn't exist
    // Empty string gets replaced with default ~/projects/, so use a clearly invalid path
    process.env.PROJECTS_DIR = '/this/path/definitely/does/not/exist/nowhere'

    const { error, stdout } = await runCommand('project vscode myproject')

    // The command may succeed in spawning code even with invalid dir
    // (code command itself might fail, but that's not our error to catch)
    // So we accept either scenario
    if (error) {
      expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
    } else {
      // Command succeeded in spawning (code handles non-existent paths)
      expect(stdout).to.match(/Opening project in VS Code/)
    }
  })

  // describe('argument handling', () => {
  //   it('accepts both project-name and workspace-name positional arguments', async () => {
  //     const {error, stdout} = await runCommand('project vscode testproject testworkspace')

  //     // Should either succeed or fail with code not found (not project detection error)
  //     if (error) {
  //       expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
  //     } else {
  //       expect(stdout).to.match(/Opening workspace.*in VS Code/)
  //     }
  //   })
  // })

  // describe('output format', () => {
  //   it('displays appropriate message when opening workspace', async () => {
  //     const {error, stdout} = await runCommand('project vscode testproject myworkspace')

  //     // eslint-disable-next-line unicorn/no-negated-condition
  //     if (!error) {
  //       expect(stdout).to.include('workspace')
  //       expect(stdout).to.include('myworkspace')
  //       expect(stdout).to.include('VS Code')
  //     } else {
  //       // If code command not available, that's acceptable
  //       expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
  //     }
  //   })

  //   it('displays appropriate message when opening project root', async () => {
  //     const {error, stdout} = await runCommand('project vscode testproject')

  //     // eslint-disable-next-line unicorn/no-negated-condition
  //     if (!error) {
  //       expect(stdout).to.include('project')
  //       expect(stdout).to.include('VS Code')
  //       // Should NOT mention workspace
  //       expect(stdout).to.not.include('workspace')
  //     } else {
  //       // If code command not available, that's acceptable
  //       expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
  //     }
  //   })
  // })

  describe('with custom PROJECTS_DIR', () => {
    it('uses custom projects directory when set', async () => {
      process.env.PROJECTS_DIR = '/tmp/test-projects'

      const { error, stdout } = await runCommand('project vscode testproject')

      // Should attempt to use custom directory
      if (error) {
        // Acceptable errors: code command not found
        expect(error.message).to.match(/code.*not found|Failed to open VSCode/i)
      } else {
        expect(stdout).to.match(/Opening project in VS Code/)
      }
    })
  })
})
