import {runCommand} from '@oclif/test'
import {expect} from 'chai'

import {CliConfigManager} from '../../../src/config/cli.config.js'

describe('config write', () => {
  const testPackageName = 'test-homelab-cli-write-cmd'

  describe('writing string values', () => {
    it('should write logLevel value', async () => {
      const {error, stdout} = await runCommand('config write logLevel warn')

      if (error) {
        throw error
      }

      expect(stdout).to.contain('Set logLevel = warn')
      expect(stdout).to.contain('Config file:')
    })

    it('should write different logLevel values', async () => {
      const {error, stdout} = await runCommand('config write logLevel error')

      if (error) {
        throw error
      }

      expect(stdout).to.contain('Set logLevel = error')
    })
  })

  describe('writing boolean values', () => {
    it('should parse and write boolean value "true"', async () => {
      const {error, stdout} = await runCommand('config write colorOutput true')

      if (error) {
        throw error
      }

      expect(stdout).to.contain('Set colorOutput = true')
      expect(stdout).to.contain('Config file:')
    })

    it('should parse and write boolean value "false"', async () => {
      const {error, stdout} = await runCommand('config write colorOutput false')

      if (error) {
        throw error
      }

      expect(stdout).to.contain('Set colorOutput = false')
      expect(stdout).to.contain('Config file:')
    })
  })

  describe('persistence', () => {
    it('should persist value to configstore', async () => {
      // Use a unique package name for this test
      const uniquePackageName = `${testPackageName}-persist-${Date.now()}`

      // Write via config manager
      const config1 = new CliConfigManager(uniquePackageName)
      config1.set('logLevel', 'debug')

      // Read with new instance to verify persistence
      const config2 = new CliConfigManager(uniquePackageName)
      expect(config2.get('logLevel')).to.equal('debug')
    })

    it('should allow overwriting existing values', async () => {
      const uniquePackageName = `${testPackageName}-overwrite-${Date.now()}`

      const config = new CliConfigManager(uniquePackageName)
      config.set('logLevel', 'info')
      expect(config.get('logLevel')).to.equal('info')

      config.set('logLevel', 'warn')
      expect(config.get('logLevel')).to.equal('warn')
    })
  })

  describe('required arguments', () => {
    it('should fail when key argument is missing', async () => {
      const {error} = await runCommand('config write')

      expect(error).to.exist
      expect(error?.message).to.match(/Missing .+ required arg/)
    })

    it('should fail when value argument is missing', async () => {
      const {error} = await runCommand('config write logLevel')

      expect(error).to.exist
      expect(error?.message).to.match(/Missing .+ required arg/)
    })
  })

  describe('output format', () => {
    it('should display confirmation message', async () => {
      const {error, stdout} = await runCommand('config write logLevel info')

      if (error) {
        throw error
      }

      expect(stdout).to.match(/Set .+ = .+/)
    })

    it('should display config file path', async () => {
      const {error, stdout} = await runCommand('config write logLevel info')

      if (error) {
        throw error
      }

      expect(stdout).to.contain('Config file:')
      expect(stdout).to.match(/homelab-cli/)
    })
  })
})
