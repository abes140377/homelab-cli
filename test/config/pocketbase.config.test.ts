import {expect} from 'chai'

import {loadPocketBaseConfig} from '../../src/config/pocketbase.config.js'

describe('PocketBase Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
    delete process.env.POCKETBASE_URL
    delete process.env.POCKETBASE_ADMIN_EMAIL
    delete process.env.POCKETBASE_ADMIN_PASSWORD
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('loadPocketBaseConfig', () => {
    it('should load valid configuration with all fields', () => {
      process.env.POCKETBASE_URL = 'http://127.0.0.1:8090'
      process.env.POCKETBASE_ADMIN_EMAIL = 'admin@example.com'
      process.env.POCKETBASE_ADMIN_PASSWORD = 'secure-password'

      const config = loadPocketBaseConfig()

      expect(config).to.deep.equal({
        adminEmail: 'admin@example.com',
        adminPassword: 'secure-password',
        url: 'http://127.0.0.1:8090',
      })
    })

    it('should load valid configuration with only URL (no auth)', () => {
      process.env.POCKETBASE_URL = 'http://127.0.0.1:8090'

      const config = loadPocketBaseConfig()

      expect(config).to.deep.equal({
        url: 'http://127.0.0.1:8090',
      })
    })

    it('should load valid configuration with HTTPS URL', () => {
      process.env.POCKETBASE_URL = 'https://pocketbase.example.com'

      const config = loadPocketBaseConfig()

      expect(config.url).to.equal('https://pocketbase.example.com')
    })

    it('should throw error when POCKETBASE_URL is missing', () => {
      expect(() => loadPocketBaseConfig()).to.throw('POCKETBASE_URL environment variable is required')
    })

    it('should throw error when POCKETBASE_URL is empty', () => {
      process.env.POCKETBASE_URL = ''

      expect(() => loadPocketBaseConfig()).to.throw('POCKETBASE_URL environment variable is required')
    })

    it('should throw error when POCKETBASE_URL is not a valid URL', () => {
      process.env.POCKETBASE_URL = 'not-a-valid-url'

      expect(() => loadPocketBaseConfig()).to.throw('Invalid PocketBase configuration')
      expect(() => loadPocketBaseConfig()).to.throw('POCKETBASE_URL must be a valid URL')
    })

    it('should throw error when POCKETBASE_ADMIN_EMAIL is not a valid email', () => {
      process.env.POCKETBASE_URL = 'http://127.0.0.1:8090'
      process.env.POCKETBASE_ADMIN_EMAIL = 'not-an-email'

      expect(() => loadPocketBaseConfig()).to.throw('Invalid PocketBase configuration')
    })

    it('should accept configuration with only email (no password)', () => {
      process.env.POCKETBASE_URL = 'http://127.0.0.1:8090'
      process.env.POCKETBASE_ADMIN_EMAIL = 'admin@example.com'

      const config = loadPocketBaseConfig()

      expect(config.adminEmail).to.equal('admin@example.com')
      expect(config.adminPassword).to.be.undefined
    })

    it('should accept configuration with only password (no email)', () => {
      process.env.POCKETBASE_URL = 'http://127.0.0.1:8090'
      process.env.POCKETBASE_ADMIN_PASSWORD = 'password'

      const config = loadPocketBaseConfig()

      expect(config.adminPassword).to.equal('password')
      expect(config.adminEmail).to.be.undefined
    })

    it('should throw error when POCKETBASE_ADMIN_PASSWORD is empty', () => {
      process.env.POCKETBASE_URL = 'http://127.0.0.1:8090'
      process.env.POCKETBASE_ADMIN_EMAIL = 'admin@example.com'
      process.env.POCKETBASE_ADMIN_PASSWORD = ''

      expect(() => loadPocketBaseConfig()).to.throw('Invalid PocketBase configuration')
    })
  })
})
