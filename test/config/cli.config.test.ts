import {expect} from 'chai'

import {CliConfigManager} from '../../src/config/cli.config.js'

describe('CLI Configuration', () => {
  const originalEnv = process.env

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

  describe('CliConfigManager', () => {
    describe('get() with defaults', () => {
      it('should return default logLevel when no env var or configstore value exists', () => {
        const config = new CliConfigManager('test-homelab-cli-defaults')
        const logLevel = config.get('logLevel')

        expect(logLevel).to.equal('info')
      })

      it('should return default colorOutput when no env var or configstore value exists', () => {
        const config = new CliConfigManager('test-homelab-cli-defaults-color')
        const colorOutput = config.get('colorOutput')

        expect(colorOutput).to.equal(true)
      })
    })

    describe('get() with environment variable override', () => {
      it('should prioritize HOMELAB_LOG_LEVEL env var over defaults', () => {
        process.env.HOMELAB_LOG_LEVEL = 'debug'
        const config = new CliConfigManager('test-homelab-cli-env-log')

        expect(config.get('logLevel')).to.equal('debug')
      })

      it('should prioritize HOMELAB_COLOR_OUTPUT env var over defaults', () => {
        process.env.HOMELAB_COLOR_OUTPUT = 'false'
        const config = new CliConfigManager('test-homelab-cli-env-color')

        expect(config.get('colorOutput')).to.equal(false)
      })

      it('should parse "true" string as boolean true for colorOutput', () => {
        process.env.HOMELAB_COLOR_OUTPUT = 'true'
        const config = new CliConfigManager('test-homelab-cli-env-true')

        expect(config.get('colorOutput')).to.equal(true)
      })

      it('should parse "false" string as boolean false for colorOutput', () => {
        process.env.HOMELAB_COLOR_OUTPUT = 'false'
        const config = new CliConfigManager('test-homelab-cli-env-false')

        expect(config.get('colorOutput')).to.equal(false)
      })
    })

    describe('set() and persistence', () => {
      it('should persist logLevel value to configstore', () => {
        const config = new CliConfigManager('test-homelab-cli-set-log')
        config.set('logLevel', 'warn')

        // Create new instance to verify persistence
        const config2 = new CliConfigManager('test-homelab-cli-set-log')
        expect(config2.get('logLevel')).to.equal('warn')
      })

      it('should persist colorOutput value to configstore', () => {
        const config = new CliConfigManager('test-homelab-cli-set-color')
        config.set('colorOutput', false)

        // Create new instance to verify persistence
        const config2 = new CliConfigManager('test-homelab-cli-set-color')
        expect(config2.get('colorOutput')).to.equal(false)
      })

      it('should allow overwriting existing configstore values', () => {
        const config = new CliConfigManager('test-homelab-cli-overwrite')
        config.set('logLevel', 'debug')
        expect(config.get('logLevel')).to.equal('debug')

        config.set('logLevel', 'error')
        expect(config.get('logLevel')).to.equal('error')
      })
    })

    describe('precedence: env > configstore > defaults', () => {
      it('should prioritize env var over configstore value', () => {
        const config = new CliConfigManager('test-homelab-cli-precedence')
        config.set('logLevel', 'warn')

        process.env.HOMELAB_LOG_LEVEL = 'error'

        expect(config.get('logLevel')).to.equal('error')
      })

      it('should use configstore value when env var is not set', () => {
        const config = new CliConfigManager('test-homelab-cli-configstore')
        config.set('logLevel', 'debug')

        expect(config.get('logLevel')).to.equal('debug')
      })

      it('should use default when neither env var nor configstore value exists', () => {
        const config = new CliConfigManager('test-homelab-cli-only-defaults')

        expect(config.get('logLevel')).to.equal('info')
      })
    })

    describe('getAll()', () => {
      it('should return all config values with defaults', () => {
        const config = new CliConfigManager('test-homelab-cli-getall-defaults')
        const allConfig = config.getAll()

        expect(allConfig).to.deep.equal({
          colorOutput: true,
          logLevel: 'info',
        })
      })

      it('should return all config values with configstore overrides', () => {
        const config = new CliConfigManager('test-homelab-cli-getall-store')
        config.set('logLevel', 'error')
        config.set('colorOutput', false)

        const allConfig = config.getAll()

        expect(allConfig).to.deep.equal({
          colorOutput: false,
          logLevel: 'error',
        })
      })

      it('should return all config values with env var overrides', () => {
        process.env.HOMELAB_LOG_LEVEL = 'debug'
        process.env.HOMELAB_COLOR_OUTPUT = 'false'

        const config = new CliConfigManager('test-homelab-cli-getall-env')
        const allConfig = config.getAll()

        expect(allConfig).to.deep.equal({
          colorOutput: false,
          logLevel: 'debug',
        })
      })

      it('should return mixed config values with different precedence sources', () => {
        process.env.HOMELAB_LOG_LEVEL = 'warn'

        const config = new CliConfigManager('test-homelab-cli-getall-mixed')
        config.set('colorOutput', false)

        const allConfig = config.getAll()

        expect(allConfig).to.deep.equal({
          colorOutput: false,
          logLevel: 'warn', // from env
        })
      })
    })

    describe('getPath()', () => {
      it('should return a non-empty path to config file', () => {
        const config = new CliConfigManager('test-homelab-cli-path')
        const path = config.getPath()

        expect(path).to.be.a('string')
        expect(path.length).to.be.greaterThan(0)
      })

      it('should return path containing the package name', () => {
        const packageName = 'test-homelab-cli-custom-path'
        const config = new CliConfigManager(packageName)
        const path = config.getPath()

        expect(path).to.include(packageName)
      })
    })
  })
})
