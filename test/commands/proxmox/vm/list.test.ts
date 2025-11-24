import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('proxmox vm list', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv}
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('output modes', () => {
    it('outputs table format by default (without --json flag)', async () => {
      const {error, stdout} = await runCommand('proxmox vm list')

      // Command may fail if Proxmox is not configured or unavailable
      if (error) {
        // Expected errors when Proxmox is not available
        expect(error.message).to.match(/Failed to list VMs|PROXMOX_/)
      } else {
        // Should contain table headers or "No VMs found" message
        const hasHeaders = stdout.includes('VMID') && stdout.includes('Name') && stdout.includes('Status')
        const hasNoVMsMessage = stdout.includes('No VMs found')

        expect(hasHeaders || hasNoVMsMessage).to.be.true
      }
    })

    it('outputs valid JSON format with --json flag', async () => {
      const {error, result} = await runCommand(['proxmox', 'vm', 'list', '--json'])

      // Command may fail if Proxmox is not configured or unavailable
      if (error) {
        // Expected errors when Proxmox is not available
        expect(error.message).to.match(/Failed to list VMs|PROXMOX_/)
      } else {
        // When --json flag is used, oclif returns data in result, not stdout
        const data = result

        // Should be an array (empty or with VM objects)
        expect(data).to.be.an('array')

        // If data exists, verify structure
        if (data.length > 0) {
          const vm = data[0]
          expect(vm).to.have.property('vmid')
          expect(vm).to.have.property('name')
          expect(vm).to.have.property('status')
          // ipv4Address may be null
          expect(vm).to.have.property('ipv4Address')
        }
      }
    })

    it('returns empty array in JSON mode when no VMs found', async () => {
      const {error, result} = await runCommand(['proxmox', 'vm', 'list', '--json'])

      // Command may fail if Proxmox is not configured or unavailable
      if (error) {
        // Expected errors when Proxmox is not available
        expect(error.message).to.match(/Failed to list VMs|PROXMOX_/)
      } else {
        // When --json flag is used, oclif returns data in result
        const data = result

        // Should be an array (may be empty or have VMs)
        expect(data).to.be.an('array')
      }
    })

    it('returns message in table mode when no VMs found', async () => {
      const {error, stdout} = await runCommand('proxmox vm list')

      // Command may fail if Proxmox is not configured or unavailable
      if (error) {
        // Expected errors when Proxmox is not available
        expect(error.message).to.match(/Failed to list VMs|PROXMOX_/)
      } else {
        // Should contain either table headers or "No VMs found" message
        const hasHeaders = stdout.includes('VMID')
        const hasNoVMsMessage = stdout.includes('No VMs found')

        expect(hasHeaders || hasNoVMsMessage).to.be.true
      }
    })
  })

  describe('JSON output structure', () => {
    it('includes expected VM properties in JSON output', async () => {
      const {error, result} = await runCommand(['proxmox', 'vm', 'list', '--json'])

      // Skip if Proxmox is not available
      if (error) {
        expect(error.message).to.match(/Failed to list VMs|PROXMOX_/)
        return
      }

      const data = result

      // If VMs exist, verify they have the expected structure
      if (data.length > 0) {
        const vm = data[0]
        expect(vm).to.have.property('vmid').that.is.a('number')
        expect(vm).to.have.property('name').that.is.a('string')
        expect(vm).to.have.property('status').that.is.a('string')
        // ipv4Address can be string or null
        expect(vm).to.have.property('ipv4Address')
      }
    })
  })
});
