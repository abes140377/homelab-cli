import {expect} from 'chai'

import {CommandExecutionOptionsDto} from '../../src/models/command-execution-options.dto.js'
import {CommandExecutionResultDto} from '../../src/models/command-execution-result.dto.js'
import {
  formatExecutionComplete,
  formatExecutionError,
  formatExecutionStart,
} from '../../src/utils/command-output-formatter.js'

describe('command-output-formatter', () => {
  describe('formatExecutionStart', () => {
    it('should format simple command without options', () => {
      const output = formatExecutionStart('echo', ['hello'])

      expect(output).to.contain('Executing: echo hello')
      expect(output).to.contain('─'.repeat(60))
    })

    it('should format command with working directory', () => {
      const options = new CommandExecutionOptionsDto('/tmp')
      const output = formatExecutionStart('ls', [], options)

      expect(output).to.contain('Executing: ls')
      expect(output).to.contain('Working Directory: /tmp')
    })

    it('should format command with environment variables', () => {
      const options = new CommandExecutionOptionsDto(undefined, {
        CUSTOM_VAR: 'value',
        NODE_ENV: 'test',
      })
      const output = formatExecutionStart('node', ['script.js'], options)

      expect(output).to.contain('Executing: node script.js')
      expect(output).to.contain('Environment Variables:')
      expect(output).to.contain('NODE_ENV=test')
      expect(output).to.contain('CUSTOM_VAR=value')
    })

    it('should format command with timeout', () => {
      const options = new CommandExecutionOptionsDto(undefined, undefined, 5000)
      const output = formatExecutionStart('sleep', ['10'], options)

      expect(output).to.contain('Executing: sleep 10')
      expect(output).to.contain('Timeout: 5000ms')
    })

    it('should format command with all options', () => {
      const options = new CommandExecutionOptionsDto(
        '/home/user',
        {DEBUG: 'true'},
        3000,
      )
      const output = formatExecutionStart('npm', ['test'], options)

      expect(output).to.contain('Executing: npm test')
      expect(output).to.contain('Working Directory: /home/user')
      expect(output).to.contain('Environment Variables:')
      expect(output).to.contain('DEBUG=true')
      expect(output).to.contain('Timeout: 3000ms')
    })

    it('should handle command with no arguments', () => {
      const output = formatExecutionStart('pwd', [])

      expect(output).to.contain('Executing: pwd')
    })
  })

  describe('formatExecutionComplete', () => {
    it('should format successful execution result', () => {
      const result = new CommandExecutionResultDto(
        'echo',
        ['hello'],
        0,
        'hello\n',
        '',
        123,
      )
      const output = formatExecutionComplete(result)

      expect(output).to.contain('Completed: echo hello')
      expect(output).to.contain('Exit Code: 0')
      expect(output).to.contain('Execution Time: 123ms (0.12s)')
      expect(output).to.contain('Output Lines: 1')
    })

    it('should format result with stderr', () => {
      const result = new CommandExecutionResultDto(
        'git',
        ['status'],
        0,
        'On branch main\n',
        'warning: some warning\n',
        456,
      )
      const output = formatExecutionComplete(result)

      expect(output).to.contain('Completed: git status')
      expect(output).to.contain('Exit Code: 0')
      expect(output).to.contain('Execution Time: 456ms (0.46s)')
      expect(output).to.contain('Output Lines: 1')
      expect(output).to.contain('Error Lines: 1')
    })

    it('should format result with non-zero exit code', () => {
      const result = new CommandExecutionResultDto(
        'ls',
        ['/nonexistent'],
        1,
        '',
        'ls: /nonexistent: No such file or directory\n',
        89,
      )
      const output = formatExecutionComplete(result)

      expect(output).to.contain('Completed: ls /nonexistent')
      expect(output).to.contain('Exit Code: 1')
      expect(output).to.contain('Execution Time: 89ms (0.09s)')
    })

    it('should handle command with no arguments', () => {
      const result = new CommandExecutionResultDto(
        'pwd',
        [],
        0,
        '/home/user\n',
        '',
        45,
      )
      const output = formatExecutionComplete(result)

      expect(output).to.contain('Completed: pwd')
      expect(output).to.contain('Exit Code: 0')
    })
  })

  describe('formatExecutionError', () => {
    it('should format basic error', () => {
      const error = new Error('Command failed')
      const output = formatExecutionError('git', ['status'], error)

      expect(output).to.contain('Failed: git status')
      expect(output).to.contain('Error: Command failed')
      expect(output).to.contain('✗'.repeat(60))
    })

    it('should format error with exit code', () => {
      const error = new Error('Non-zero exit')
      const output = formatExecutionError('npm', ['test'], error, 1)

      expect(output).to.contain('Failed: npm test')
      expect(output).to.contain('Error: Non-zero exit')
      expect(output).to.contain('Exit Code: 1')
    })

    it('should format error with stderr output', () => {
      const error = new Error('Command failed')
      const stderr = 'fatal: not a git repository'
      const output = formatExecutionError('git', ['status'], error, 128, stderr)

      expect(output).to.contain('Failed: git status')
      expect(output).to.contain('Error: Command failed')
      expect(output).to.contain('Exit Code: 128')
      expect(output).to.contain('Error Output:')
      expect(output).to.contain('fatal: not a git repository')
    })

    it('should handle command with no arguments', () => {
      const error = new Error('Command not found')
      const output = formatExecutionError('nonexistent', [], error)

      expect(output).to.contain('Failed: nonexistent')
      expect(output).to.contain('Error: Command not found')
    })
  })
})
