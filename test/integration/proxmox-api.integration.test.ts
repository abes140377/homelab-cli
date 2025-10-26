import {expect} from 'chai'

import {loadProxmoxConfig} from '../../src/config/proxmox.config.js'
import {ProxmoxApiRepository} from '../../src/repositories/proxmox-api.repository.js'

/**
 * Integration tests for ProxmoxApiRepository.
 * These tests require a real Proxmox server and are skipped if environment variables are not set.
 *
 * To run these tests, set the following environment variables:
 * - PROXMOX_USER: Proxmox user (e.g., root)
 * - PROXMOX_REALM: Authentication realm (e.g., pam)
 * - PROXMOX_TOKEN_KEY: Token identifier (e.g., homelabcli)
 * - PROXMOX_TOKEN_SECRET: Token secret (UUID format, e.g., bd2ed89e-6a09-48e8-8a6e-38da9128c8ce)
 * - PROXMOX_HOST: Proxmox hostname without protocol (e.g., proxmox.home.sflab.io)
 * - PROXMOX_PORT: Port number (optional, defaults to 8006)
 *
 * Example:
 *   export PROXMOX_USER=root
 *   export PROXMOX_REALM=pam
 *   export PROXMOX_TOKEN_KEY=homelabcli
 *   export PROXMOX_TOKEN_SECRET=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce
 *   export PROXMOX_HOST=proxmox.home.sflab.io
 *   export PROXMOX_PORT=8006
 *   pnpm test
 */
describe('ProxmoxApiRepository Integration Tests', () => {
  // Check if environment variables are set
  const hasEnvVars = process.env.PROXMOX_USER &&
                     process.env.PROXMOX_REALM &&
                     process.env.PROXMOX_TOKEN_KEY &&
                     process.env.PROXMOX_TOKEN_SECRET &&
                     process.env.PROXMOX_HOST

  // Skip all tests if environment variables are not set
  if (!hasEnvVars) {
    console.log('\n⚠️  Skipping Proxmox integration tests - required environment variables not set\n')
    console.log('   Required: PROXMOX_USER, PROXMOX_REALM, PROXMOX_TOKEN_KEY, PROXMOX_TOKEN_SECRET, PROXMOX_HOST\n')
  }

  const describeOrSkip = hasEnvVars ? describe : describe.skip

  describeOrSkip('Connection and Template Listing', () => {
    let repository: ProxmoxApiRepository

    before(() => {
      // Disable TLS certificate verification for self-signed certs for all tests
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

      // Load configuration from environment
      const config = loadProxmoxConfig()
      repository = new ProxmoxApiRepository(config)
    })

    it('should successfully connect to Proxmox server', async function () {
      // Increase timeout for real API call
      this.timeout(10_000)

      const result = await repository.listTemplates()

      expect(result.success).to.be.true
      if (!result.success) {
        console.error('Connection failed:', result.error)
      }
    })

    it('should retrieve templates from Proxmox server', async function () {
      // Increase timeout for real API call
      this.timeout(10_000)

      const result = await repository.listTemplates()

      expect(result.success).to.be.true
      if (result.success) {
        // Verify we got an array (might be empty if no templates exist)
        expect(result.data).to.be.an('array')

        console.log(`\n✅ Retrieved ${result.data.length} templates from Proxmox server\n`)

        // If templates exist, validate their structure
        if (result.data.length > 0) {
          const template = result.data[0]

          expect(template).to.have.property('vmid')
          expect(template).to.have.property('name')
          expect(template).to.have.property('template')
          expect(template.vmid).to.be.a('number')
          expect(template.name).to.be.a('string')
          expect(template.template).to.equal(1)
        }
      }
    })

    it('should return templates with valid vmid, name, and template fields', async function () {
      this.timeout(10_000)

      const result = await repository.listTemplates()

      expect(result.success).to.be.true
      if (result.success && result.data.length > 0) {
        for (const template of result.data) {
          // Validate structure
          expect(template.vmid).to.be.a('number').and.to.be.greaterThan(0)
          expect(template.name).to.be.a('string').and.not.to.be.empty
          expect(template.template).to.equal(1)

          console.log(`  - Template ${template.vmid}: ${template.name}`)
        }
      } else if (result.success && result.data.length === 0) {
        console.log('  ℹ️  No templates found on Proxmox server (this is OK)')
        this.skip()
      }
    })

    it('should return templates sorted by vmid in ascending order', async function () {
      this.timeout(10_000)

      const result = await repository.listTemplates()

      expect(result.success).to.be.true
      if (result.success && result.data.length > 1) {
        // Check if sorted
        for (let i = 0; i < result.data.length - 1; i++) {
          expect(result.data[i].vmid).to.be.at.most(result.data[i + 1].vmid)
        }
      } else if (result.success && result.data.length <= 1) {
        console.log('  ℹ️  Less than 2 templates found, cannot verify sorting')
        this.skip()
      }
    })

    it('should handle connection with real Proxmox API without errors', async function () {
      this.timeout(10_000)

      const result = await repository.listTemplates()

      // Should not throw errors
      expect(result).to.exist
      expect(result).to.have.property('success')

      if (!result.success) {
        console.error('\n❌ Error details:', result.error.message)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((result.error as any).context) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.error('   Context:', (result.error as any).context)
        }
      }

      expect(result.success).to.be.true
    })
  })

  // Test for error handling with invalid configuration
  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        host: 'invalid-hostname',
        port: 8006,
        realm: 'pam',
        tokenKey: 'testtoken',
        tokenSecret: '12345678-1234-1234-1234-123456789abc',
        user: 'root',
      }

      const repository = new ProxmoxApiRepository(invalidConfig)
      const result = await repository.listTemplates()

      expect(result.success).to.be.false
      if (!result.success) {
        expect(result.error.message).to.include('Failed to connect to Proxmox API')
      }
    })
  })
})
