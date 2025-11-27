import {expect} from 'chai'

import {CliConfigManager} from '../../src/config/cli.config.js'

describe('CLI Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
    delete process.env.HOMELAB_LOG_LEVEL
    delete process.env.HOMELAB_COLOR_OUTPUT
    delete process.env.PROJECTS_DIR
    delete process.env.PROXMOX_USER
    delete process.env.PROXMOX_REALM
    delete process.env.PROXMOX_TOKEN_KEY
    delete process.env.PROXMOX_TOKEN_SECRET
    delete process.env.PROXMOX_HOST
    delete process.env.PROXMOX_PORT
    delete process.env.PROXMOX_REJECT_UNAUTHORIZED
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

    describe('projectsDir configuration', () => {
      it('should return default projectsDir when no env var exists', () => {
        const config = new CliConfigManager('test-homelab-cli-projects-default')
        const projectsDir = config.get('projectsDir')

        expect(projectsDir).to.be.a('string')
        expect(projectsDir).to.include('projects')
      })

      it('should use PROJECTS_DIR env var when set', () => {
        process.env.PROJECTS_DIR = '/custom/projects'
        const config = new CliConfigManager('test-homelab-cli-projects-env')

        expect(config.get('projectsDir')).to.equal('/custom/projects')
      })

      it('should expand ~ to home directory in default', () => {
        const config = new CliConfigManager('test-homelab-cli-projects-expand')
        const projectsDir = config.get('projectsDir')

        expect(projectsDir).to.not.include('~')
      })

      it('should expand ~ in PROJECTS_DIR env var', () => {
        process.env.PROJECTS_DIR = '~/my-projects'
        const config = new CliConfigManager('test-homelab-cli-projects-expand-env')
        const projectsDir = config.get('projectsDir')

        expect(projectsDir).to.not.include('~')
        expect(projectsDir).to.include('my-projects')
      })
    })

    describe('proxmox configuration', () => {
      it('should return default empty proxmox config when no env vars exist', () => {
        const config = new CliConfigManager('test-homelab-cli-proxmox-default')
        const proxmox = config.get('proxmox')

        expect(proxmox).to.be.an('object')
        expect(proxmox.port).to.equal(8006)
        expect(proxmox.rejectUnauthorized).to.equal(true)
      })

      it('should load proxmox config from environment variables', () => {
        process.env.PROXMOX_USER = 'root'
        process.env.PROXMOX_REALM = 'pam'
        process.env.PROXMOX_TOKEN_KEY = 'homelabcli'
        process.env.PROXMOX_TOKEN_SECRET = 'some-example-for-a-secret'
        process.env.PROXMOX_HOST = 'proxmox.home.sflab.io'
        process.env.PROXMOX_PORT = '8006'

        const config = new CliConfigManager('test-homelab-cli-proxmox-env')
        const proxmox = config.get('proxmox')

        expect(proxmox).to.deep.equal({
          host: 'proxmox.home.sflab.io',
          port: 8006,
          realm: 'pam',
          rejectUnauthorized: true,
          tokenKey: 'homelabcli',
          tokenSecret: 'some-example-for-a-secret',
          user: 'root',
        })
      })

      it('should use default port 8006 when PROXMOX_PORT is omitted', () => {
        process.env.PROXMOX_USER = 'root'
        process.env.PROXMOX_REALM = 'pam'
        process.env.PROXMOX_TOKEN_KEY = 'homelabcli'
        process.env.PROXMOX_TOKEN_SECRET = 'some-example-for-a-secret'
        process.env.PROXMOX_HOST = 'proxmox.home.sflab.io'

        const config = new CliConfigManager('test-homelab-cli-proxmox-port-default')
        const proxmox = config.get('proxmox')

        expect(proxmox.port).to.equal(8006)
      })

      it('should set rejectUnauthorized to false when PROXMOX_REJECT_UNAUTHORIZED is "false"', () => {
        process.env.PROXMOX_USER = 'root'
        process.env.PROXMOX_REALM = 'pam'
        process.env.PROXMOX_TOKEN_KEY = 'homelabcli'
        process.env.PROXMOX_TOKEN_SECRET = 'some-example-for-a-secret'
        process.env.PROXMOX_HOST = 'proxmox.home.sflab.io'
        process.env.PROXMOX_REJECT_UNAUTHORIZED = 'false'

        const config = new CliConfigManager('test-homelab-cli-proxmox-reject-false')
        const proxmox = config.get('proxmox')

        expect(proxmox.rejectUnauthorized).to.equal(false)
      })

      it('should persist proxmox config to configstore', () => {
        const config = new CliConfigManager('test-homelab-cli-proxmox-persist')
        config.set('proxmox', {
          host: 'proxmox.local',
          port: 8443,
          realm: 'pve',
          rejectUnauthorized: false,
          tokenKey: 'mytoken',
          tokenSecret: '12345678-1234-1234-1234-123456789abc',
          user: 'admin',
        })

        // Create new instance to verify persistence
        const config2 = new CliConfigManager('test-homelab-cli-proxmox-persist')
        const proxmox = config2.get('proxmox')

        expect(proxmox.host).to.equal('proxmox.local')
        expect(proxmox.port).to.equal(8443)
        expect(proxmox.user).to.equal('admin')
      })
    })

    describe('getAll()', () => {
      it('should return all config values with defaults', () => {
        const config = new CliConfigManager('test-homelab-cli-getall-defaults')
        const allConfig = config.getAll()

        expect(allConfig).to.have.property('colorOutput')
        expect(allConfig).to.have.property('logLevel')
        expect(allConfig).to.have.property('projectsDir')
        expect(allConfig).to.have.property('proxmox')
        expect(allConfig.colorOutput).to.equal(true)
        expect(allConfig.logLevel).to.equal('info')
      })

      it('should return all config values with configstore overrides', () => {
        const config = new CliConfigManager('test-homelab-cli-getall-store')
        config.set('logLevel', 'error')
        config.set('colorOutput', false)

        const allConfig = config.getAll()

        expect(allConfig.colorOutput).to.equal(false)
        expect(allConfig.logLevel).to.equal('error')
      })

      it('should return all config values with env var overrides', () => {
        process.env.HOMELAB_LOG_LEVEL = 'debug'
        process.env.HOMELAB_COLOR_OUTPUT = 'false'

        const config = new CliConfigManager('test-homelab-cli-getall-env')
        const allConfig = config.getAll()

        expect(allConfig.colorOutput).to.equal(false)
        expect(allConfig.logLevel).to.equal('debug')
      })

      it('should return mixed config values with different precedence sources', () => {
        process.env.HOMELAB_LOG_LEVEL = 'warn'

        const config = new CliConfigManager('test-homelab-cli-getall-mixed')
        config.set('colorOutput', false)

        const allConfig = config.getAll()

        expect(allConfig.colorOutput).to.equal(false)
        expect(allConfig.logLevel).to.equal('warn') // from env
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
