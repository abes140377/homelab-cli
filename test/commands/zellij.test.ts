import {afterEach, beforeEach, describe} from 'mocha'

describe('zellij', () => {
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

  // it('runs with explicit module and config name', async () => {
  //   const {error, stdout} = await runCommand('zellij homelab-cli default')
  //
  //   // Command should succeed or fail based on whether 'zellij' is available
  //   if (error) {
  //     // Acceptable errors: zellij command not found, spawn error
  //     expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
  //   } else {
  //     // Success message should mention opening or attaching to session
  //     expect(stdout).to.match(/Opening new Zellij session.*homelab-cli.*default|Attaching to existing Zellij session.*homelab-cli/i)
  //   }
  // })

  // it('runs with module name only (auto-detect config)', async () => {
  //   const {error, stdout} = await runCommand('zellij homelab-cli')
  //
  //   // Command should succeed or fail based on whether 'zellij' is available
  //   if (error) {
  //     // Acceptable errors: zellij command not found, spawn error
  //     expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
  //   } else {
  //     // Success message should mention opening or attaching to session for the module
  //     expect(stdout).to.match(/Opening new Zellij session.*homelab-cli|Attaching to existing Zellij session/i)
  //   }
  // })

  // it('shows error when project cannot be detected (outside projects directory)', async () => {
  //   // Change to a directory that's definitely not a project
  //   process.chdir('/tmp')
  //
  //   const {error} = await runCommand('zellij my-module')
  //
  //   expect(error).to.exist
  //   if (error) {
  //     // Accept either project detection error or command not found (depending on test environment)
  //     expect(error.message).to.match(/Could not detect current project|command.*not found/)
  //   }
  // })

  // it('shows error when projects directory config is invalid', async () => {
  //   // Set invalid projects directory path that doesn't exist
  //   process.env.PROJECTS_DIR = '/this/path/definitely/does/not/exist/nowhere'
  //
  //   const {error, stdout} = await runCommand('zellij my-module')
  //
  //   // The command may succeed in spawning zellij even with invalid dir
  //   // (zellij command itself might fail with config not found, but that's not our error)
  //   // So we accept either scenario
  //   if (error) {
  //     expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
  //   } else {
  //     // Command succeeded in spawning (opening new or attaching to existing)
  //     expect(stdout).to.match(/Opening new Zellij session|Attaching to existing Zellij session/i)
  //   }
  // })

  // describe('argument handling', () => {
  //   it('accepts both module-name and config-name positional arguments', async () => {
  //     const {error, stdout} = await runCommand('zellij testmodule testconfig')
  //
  //     // Should either succeed or fail with zellij not found (not project detection error)
  //     if (error) {
  //       expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
  //     } else {
  //       expect(stdout).to.match(/Opening new Zellij session.*testconfig.*testmodule|Attaching to existing Zellij session.*testconfig/i)
  //     }
  //   })
  // })

  // describe('output format', () => {
  //   it('displays appropriate message when opening Zellij session', async () => {
  //     const {error, stdout} = await runCommand('zellij testmodule testconfig')
  //
  //     if (error) {
  //       // If zellij command not available, that's acceptable
  //       expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
  //     } else {
  //       expect(stdout).to.include('Zellij session')
  //       expect(stdout).to.include('testconfig')
  //     }
  //   })
  // })

  // describe('with custom PROJECTS_DIR', () => {
  //   it('uses custom projects directory when set', async () => {
  //     process.env.PROJECTS_DIR = '/tmp/test-projects'
  //
  //     const {error, stdout} = await runCommand('zellij testmodule')
  //
  //     // Should attempt to use custom directory
  //     if (error) {
  //       // Acceptable errors: zellij command not found
  //       expect(error.message).to.match(/zellij.*not found|Failed to open Zellij/i)
  //     } else {
  //       expect(stdout).to.match(/Opening new Zellij session|Attaching to existing Zellij session/i)
  //     }
  //   })
  // })
})
