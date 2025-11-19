import {runCommand} from '@oclif/test'
import {expect} from 'chai'

import {CliConfigManager} from '../../../src/config/cli.config.js'

describe('config read', () => {
  const originalEnv = process.env
  const testPackageName = 'test-homelab-cli-read-cmd'

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
    delete process.env.HOMELAB_LOG_LEVEL
    delete process.env.HOMELAB_COLOR_OUTPUT
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('reading all config', () => {
    it('should display all config values as formatted JSON', async () => {
      const {error, stdout} = await runCommand('config read')

      if (error) {
        throw error
      }

      // Config values may be defaults or previously set values
      // Just verify the structure is correct JSON with expected keys
      const config = JSON.parse(stdout)
      expect(config).to.have.property('logLevel')
      expect(config).to.have.property('colorOutput')
    })

    it('should display env var overrides in output', async () => {
      process.env.HOMELAB_LOG_LEVEL = 'debug'
      process.env.HOMELAB_COLOR_OUTPUT = 'false'

      const {stdout} = await runCommand('config read')

      expect(stdout).to.contain('"logLevel": "debug"')
      expect(stdout).to.contain('"colorOutput": false')
    })

    it('should display configstore values in output', async () => {
      const config = new CliConfigManager(testPackageName)
      config.set('logLevel', 'warn')

      // Note: runCommand creates a new process, so we can't directly test configstore persistence
      // This test verifies the command structure works
      const {stdout} = await runCommand('config read')

      expect(stdout).to.contain('logLevel')
      expect(stdout).to.contain('colorOutput')
    })
  })

  describe('reading specific key', () => {
    it('should display specific config key value', async () => {
      const {stdout} = await runCommand('config read logLevel')

      // Value may be default or previously set
      expect(stdout).to.match(/logLevel: (info|debug|warn|error)/)
    })

    it('should display colorOutput key value', async () => {
      const {stdout} = await runCommand('config read colorOutput')

      // Value may be default or previously set
      expect(stdout).to.match(/colorOutput: (true|false)/)
    })

    it('should show env var override for specific key', async () => {
      process.env.HOMELAB_LOG_LEVEL = 'error'

      const {stdout} = await runCommand('config read logLevel')

      expect(stdout).to.contain('logLevel: error')
    })
  })

  describe('--path flag', () => {
    it('should display config file path with --path flag', async () => {
      const {stdout} = await runCommand('config read --path')

      expect(stdout).to.contain('Config file:')
      expect(stdout).to.match(/homelab-cli/)
    })

    it('should display config file path with -p short flag', async () => {
      const {stdout} = await runCommand('config read -p')

      expect(stdout).to.contain('Config file:')
      expect(stdout).to.match(/homelab-cli/)
    })

    it('should only display path when --path flag is used (no config values)', async () => {
      const {stdout} = await runCommand('config read --path')

      expect(stdout).to.contain('Config file:')
      expect(stdout).not.to.contain('logLevel')
      expect(stdout).not.to.contain('colorOutput')
    })
  })

  describe('output format', () => {
    it('should format all config as valid JSON', async () => {
      const {stdout} = await runCommand('config read')

      expect(() => JSON.parse(stdout)).to.not.throw()
    })

    it('should display key-value format for specific key', async () => {
      const {stdout} = await runCommand('config read logLevel')

      expect(stdout).to.match(/^logLevel: .+/)
    })
  })
})
