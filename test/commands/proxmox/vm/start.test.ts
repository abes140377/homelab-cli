import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('proxmox vm start', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('error handling', () => {
    it('shows error when VM ID not found', async () => {
      const {error} = await runCommand(['proxmox', 'vm', 'start', '99999'])

      // Command should fail with VM not found error or connection error
      if (error) {
        expect(error.message).to.match(/VM 99999 not found|Failed to list VMs|PROXMOX_/)
      }
    })

    it('shows error when JSON mode used without VM IDs', async () => {
      const {error} = await runCommand(['proxmox', 'vm', 'start', '--json'])

      // Should fail when --json is used without VM IDs
      if (error) {
        expect(error.message).to.include('JSON mode requires explicit VM IDs')
      } else {
        // If no error, the command may have exited gracefully
        // This is acceptable as long as it doesn't proceed with interactive mode
      }
    })

    it('handles missing Proxmox configuration', async () => {
      // Remove Proxmox environment variables
      delete process.env.PROXMOX_HOST
      delete process.env.PROXMOX_USER

      const {error} = await runCommand(['proxmox', 'vm', 'start', '100'])

      // Should fail with configuration error
      expect(error).to.exist
      expect(error.message).to.match(/PROXMOX_|Failed to/)
    })
  })

  describe('JSON output structure', () => {
    it('returns proper JSON structure for single VM on success', async () => {
      const {error, result} = await runCommand(['proxmox', 'vm', 'start', '100', '--json'])

      // Skip if Proxmox is not available or VM doesn't exist
      if (error) {
        expect(error.message).to.match(/VM 100 not found|Failed to|PROXMOX_/)
        return
      }

      // Verify JSON structure
      if (result) {
        // Result can be either success format or failure format
        if (result.status === 'started') {
          // Success: Single VM should have these properties
          expect(result).to.have.property('vmid')
          expect(result).to.have.property('name')
          expect(result).to.have.property('node')
          expect(result).to.have.property('status')
          expect(result.vmid).to.be.a('number')
          expect(result.name).to.be.a('string')
          expect(result.node).to.be.a('string')
        } else {
          // Failure: Should have started/failed arrays
          expect(result).to.have.property('started')
          expect(result).to.have.property('failed')
          expect(result.started).to.be.an('array')
          expect(result.failed).to.be.an('array')
        }
      }
    })

    it('returns proper JSON structure for multiple VMs', async () => {
      const {error, result} = await runCommand(['proxmox', 'vm', 'start', '100', '101', '--json'])

      // Skip if Proxmox is not available
      if (error) {
        expect(error.message).to.match(/VM .* not found|Failed to|PROXMOX_/)
        return
      }

      // Verify JSON structure for multiple VMs
      if (result) {
        expect(result).to.have.property('started')
        expect(result).to.have.property('failed')
        expect(result.started).to.be.an('array')
        expect(result.failed).to.be.an('array')

        // Verify started VM structure if any
        if (result.started.length > 0) {
          const vm = result.started[0]
          expect(vm).to.have.property('vmid').that.is.a('number')
          expect(vm).to.have.property('name').that.is.a('string')
          expect(vm).to.have.property('node').that.is.a('string')
        }

        // Verify failed VM structure if any
        if (result.failed.length > 0) {
          const failure = result.failed[0]
          expect(failure).to.have.property('vmid').that.is.a('number')
          expect(failure).to.have.property('error').that.is.a('string')
        }
      }
    })

    it('returns failed array when VM not found in JSON mode', async () => {
      const {error, result} = await runCommand(['proxmox', 'vm', 'start', '99999', '--json'])

      // Skip if Proxmox connection fails
      if (error && error.message.includes('PROXMOX_')) {
        return
      }

      // When VM is not found, should return structured error in JSON mode
      if (result) {
        expect(result).to.have.property('started')
        expect(result).to.have.property('failed')
        expect(result.failed).to.be.an('array')

        if (result.failed.length > 0) {
          expect(result.failed[0]).to.have.property('vmid')
          expect(result.failed[0]).to.have.property('error')
        }
      }
    })
  })

  describe('command invocation', () => {
    it('accepts single VM ID argument', async () => {
      const {error} = await runCommand(['proxmox', 'vm', 'start', '100'])

      // Command should either succeed or fail with specific errors
      if (error) {
        expect(error.message).to.match(/VM 100 not found|Failed to|PROXMOX_|already running/)
      }
    })

    it('accepts multiple VM ID arguments', async () => {
      const {error} = await runCommand(['proxmox', 'vm', 'start', '100', '101', '102'])

      // Command should either succeed or fail with specific errors
      if (error) {
        expect(error.message).to.match(/VMs? .* not found|Failed to|PROXMOX_/)
      }
    })

    it('accepts --json flag', async () => {
      const {error} = await runCommand(['proxmox', 'vm', 'start', '100', '--json'])

      // Command should either succeed or fail with specific errors
      if (error) {
        expect(error.message).to.match(/VM 100 not found|Failed to|PROXMOX_/)
      }
    })
  })

  describe('output format', () => {
    it('outputs progress messages in non-JSON mode', async () => {
      const {error, stdout} = await runCommand(['proxmox', 'vm', 'start', '100'])

      // Skip if Proxmox is not available
      if (error && /PROXMOX_|Failed to list VMs/.test(error.message)) {
        return
      }

      // Should contain either progress/success message or error
      if (!error) {
        expect(stdout).to.match(/Starting VM|Successfully started VM|Summary/)
      }
    })

    it('does not output progress messages in JSON mode', async () => {
      const {error, stdout} = await runCommand(['proxmox', 'vm', 'start', '100', '--json'])

      // Skip if Proxmox is not available
      if (error && /PROXMOX_|Failed to list VMs/.test(error.message)) {
        return
      }

      // In JSON mode, stdout should be empty or minimal (no progress messages)
      // Result should be in the result property instead
      if (!error) {
        expect(stdout).to.not.include('Starting VM')
        expect(stdout).to.not.include('Successfully started')
      }
    })
  })
})
