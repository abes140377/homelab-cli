import {expect} from 'chai'
import {describe, it} from 'mocha'
import {SinonStub, stub} from 'sinon'

import {logDebugError} from '../../src/utils/debug-logger.js'

describe('debug-logger', () => {
  describe('logDebugError', () => {
    let consoleErrorStub: SinonStub
    let originalLogLevel: string | undefined

    beforeEach(() => {
      consoleErrorStub = stub(console, 'error')
      originalLogLevel = process.env.HOMELAB_LOG_LEVEL
    })

    afterEach(() => {
      consoleErrorStub.restore()
      if (originalLogLevel === undefined) {
        delete process.env.HOMELAB_LOG_LEVEL
      } else {
        process.env.HOMELAB_LOG_LEVEL = originalLogLevel
      }
    })

    it('should output debug info when log level is debug', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Test error')

      logDebugError('Test operation failed', error, {foo: 'bar'})

      expect(consoleErrorStub.called).to.be.true
      expect(consoleErrorStub.firstCall.args[0]).to.include('[DEBUG] Test operation failed')
    })

    it('should output debug info when log level is trace', () => {
      process.env.HOMELAB_LOG_LEVEL = 'trace'
      const error = new Error('Test error')

      logDebugError('Test operation failed', error)

      expect(consoleErrorStub.called).to.be.true
      expect(consoleErrorStub.firstCall.args[0]).to.include('[DEBUG] Test operation failed')
    })

    it('should suppress output when log level is info', () => {
      process.env.HOMELAB_LOG_LEVEL = 'info'
      const error = new Error('Test error')

      logDebugError('Test operation failed', error)

      expect(consoleErrorStub.called).to.be.false
    })

    it('should suppress output when log level is warn', () => {
      process.env.HOMELAB_LOG_LEVEL = 'warn'
      const error = new Error('Test error')

      logDebugError('Test operation failed', error)

      expect(consoleErrorStub.called).to.be.false
    })

    it('should suppress output when log level is error', () => {
      process.env.HOMELAB_LOG_LEVEL = 'error'
      const error = new Error('Test error')

      logDebugError('Test operation failed', error)

      expect(consoleErrorStub.called).to.be.false
    })

    it('should include error message in output', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Detailed error message')

      logDebugError('Operation failed', error)

      const errorMessageCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Error:')
      expect(errorMessageCall).to.exist
      expect(errorMessageCall?.args[1]).to.equal('Detailed error message')
    })

    it('should include stack trace in output', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Test error')

      logDebugError('Operation failed', error)

      const stackCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Stack:')
      expect(stackCall).to.exist
      expect(stackCall?.args[1]).to.include('Error: Test error')
    })

    it('should handle error cause chain', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const rootCause = new Error('Root cause')
      const error = new Error('Wrapper error', {cause: rootCause})

      logDebugError('Operation failed', error)

      const causeCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Cause:')
      expect(causeCall).to.exist
      expect(causeCall?.args[1]).to.equal(rootCause)
    })

    it('should handle non-Error objects', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = 'String error message'

      logDebugError('Operation failed', error)

      const errorCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Error:')
      expect(errorCall).to.exist
      expect(errorCall?.args[1]).to.equal('String error message')
    })

    it('should format context as JSON', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Test error')
      const context = {host: 'example.com', port: 8006}

      logDebugError('Operation failed', error, context)

      const contextCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Context:')
      expect(contextCall).to.exist
      const {args} = contextCall ?? {args: []}
      const contextJson = args[1]
      expect(contextJson).to.include('"host": "example.com"')
      expect(contextJson).to.include('"port": 8006')
    })

    it('should skip context output when context is empty', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Test error')

      logDebugError('Operation failed', error, {})

      const contextCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Context:')
      expect(contextCall).to.not.exist
    })

    it('should skip context output when context is undefined', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Test error')

      logDebugError('Operation failed', error)

      const contextCall = consoleErrorStub.getCalls().find((call) => call.args[0] === 'Context:')
      expect(contextCall).to.not.exist
    })

    it('should include empty line for readability', () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      const error = new Error('Test error')

      logDebugError('Operation failed', error)

      const {lastCall} = consoleErrorStub
      expect(lastCall.args[0]).to.equal('')
    })
  })
})
