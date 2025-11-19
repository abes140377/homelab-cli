import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('exec demo', () => {
  it('runs exec demo successfully', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Command Execution Demo')
    expect(stdout).to.contain('Demo Summary')
  })

  it('demonstrates simple command execution', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Simple Command Execution')
    expect(stdout).to.contain('Executing: echo')
    expect(stdout).to.contain('Hello from homelab-cli!')
  })

  it('demonstrates working directory', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Working Directory')
    expect(stdout).to.contain('Executing: pwd')
    expect(stdout).to.contain('Working Directory: /tmp')
  })

  it('demonstrates environment variables', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Environment Variables')
    expect(stdout).to.contain('DEMO_VAR=Hello from custom env!')
    expect(stdout).to.contain('Custom variable:')
  })

  it('demonstrates streaming output', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Streaming Output')
    expect(stdout).to.contain('Line 1')
    expect(stdout).to.contain('Line 2')
    expect(stdout).to.contain('Line 3')
  })

  it('demonstrates error handling for non-zero exit', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Error Handling (Non-Zero Exit)')
    expect(stdout).to.contain('This will fail')
  })

  it('demonstrates error handling for command not found', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Error Handling (Command Not Found)')
    expect(stdout).to.contain('nonexistent-command-12345')
    expect(stdout).to.contain('not found')
  })

  it('displays formatted execution messages', async () => {
    const {stdout} = await runCommand('exec demo')

    // Check for separator lines
    expect(stdout).to.contain('─'.repeat(60))

    // Check for execution start/complete formatting
    expect(stdout).to.contain('Executing:')
    expect(stdout).to.contain('Completed:')
    expect(stdout).to.contain('Exit Code:')
    expect(stdout).to.contain('Execution Time:')
  })

  it('displays summary with scenario results', async () => {
    const {stdout} = await runCommand('exec demo')

    expect(stdout).to.contain('Demo Summary')
    expect(stdout).to.contain('Total Scenarios:')
    expect(stdout).to.contain('Successful:')
    expect(stdout).to.contain('Failed:')
    expect(stdout).to.contain('✓')
  })

  it('completes all demo scenarios', async () => {
    const {stdout} = await runCommand('exec demo')

    // Verify all 6 scenarios are present
    expect(stdout).to.contain('Simple Command Execution')
    expect(stdout).to.contain('Working Directory')
    expect(stdout).to.contain('Environment Variables')
    expect(stdout).to.contain('Streaming Output')
    expect(stdout).to.contain('Error Handling (Non-Zero Exit)')
    expect(stdout).to.contain('Error Handling (Command Not Found)')
  })
})
