import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import {afterEach, beforeEach, describe, it} from 'mocha';

/**
 * Command tests for `proxmox vm cloudinit`
 *
 * These tests verify the command's argument parsing, flag handling,
 * validation, and error messages. Since the command requires a live
 * Proxmox instance, we use a test config that will fail in controlled ways.
 */
describe('proxmox vm cloudinit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv};

    // Set up test Proxmox credentials with invalid host to ensure
    // tests don't make real API calls
    process.env.PROXMOX_HOST = 'nonexistent-test-host.invalid';
    process.env.PROXMOX_PORT = '8006';
    process.env.PROXMOX_USER = 'root';
    process.env.PROXMOX_REALM = 'pam';
    process.env.PROXMOX_TOKEN_KEY = 'testtoken';
    process.env.PROXMOX_TOKEN_SECRET = '12345678-1234-1234-1234-123456789abc';
    process.env.PROXMOX_REJECT_UNAUTHORIZED = 'false';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validation errors', () => {
    it('should fail with clear message for invalid IP format', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ipconfig invalid-ip --ssh-key=""',
      );

      expect(error).to.exist;
      expect(error?.message).to.include('Cloud-init configuration validation failed');
    });

    it('should fail with clear message for IP without prefix', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ipconfig 192.168.1.100 --ssh-key=""',
      );

      expect(error).to.exist;
      expect(error?.message).to.include('Cloud-init configuration validation failed');
    });

    it('should fail with clear message for empty username', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --user="" --ssh-key=""',
      );

      expect(error).to.exist;
      expect(error?.message).to.include('Cloud-init configuration validation failed');
    });

    it('should accept valid DHCP configuration', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ipconfig ip=dhcp --ssh-key=""',
      );

      // Should fail at API level (connection), not validation
      expect(error).to.exist;
      expect(error?.message).to.not.include('validation');
    });

    it('should accept valid static IP without gateway', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ipconfig ip=192.168.1.100/24 --ssh-key=""',
      );

      // Should fail at API level (connection), not validation
      expect(error).to.exist;
      expect(error?.message).to.not.include('validation');
    });

    it('should accept valid static IP with gateway', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ipconfig ip=192.168.1.100/24,gw=192.168.1.1 --ssh-key=""',
      );

      // Should fail at API level (connection), not validation
      expect(error).to.exist;
      expect(error?.message).to.not.include('validation');
    });
  });

  describe('flag handling', () => {
    it('should use default values when no flags provided', async () => {
      const {error} = await runCommand('proxmox vm cloudinit 100 --ssh-key=""');

      expect(error).to.exist;
      // Should attempt to configure with defaults (will fail at connection)
      expect(error?.message).to.include('Failed to configure cloud-init');
    });

    it('should accept custom user flag', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --user ubuntu --ssh-key=""',
      );

      expect(error).to.exist;
      expect(error?.message).to.include('Failed to configure cloud-init');
    });

    it('should accept custom password flag', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --password mypassword --ssh-key=""',
      );

      expect(error).to.exist;
      expect(error?.message).to.include('Failed to configure cloud-init');
    });

    it('should accept upgrade flag', async () => {
      const {error} = await runCommand('proxmox vm cloudinit 100 --upgrade --ssh-key=""');

      expect(error).to.exist;
      expect(error?.message).to.include('Failed to configure cloud-init');
    });

    it('should accept empty SSH key', async () => {
      const {error} = await runCommand('proxmox vm cloudinit 100 --ssh-key=""');

      expect(error).to.exist;
      expect(error?.message).to.include('Failed to configure cloud-init');
    });

    it('should accept SSH key as direct content', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ssh-key "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey user@host"',
      );

      expect(error).to.exist;
      expect(error?.message).to.include('Failed to configure cloud-init');
    });
  });

  describe('argument handling', () => {
    it('should require vmid argument', async () => {
      const {error} = await runCommand('proxmox vm cloudinit');

      expect(error).to.exist;
      expect(error?.message).to.match(/Missing.*argument|VMID/i);
    });

    it('should accept numeric vmid', async () => {
      const {error} = await runCommand('proxmox vm cloudinit 100 --ssh-key=""');

      expect(error).to.exist;
      // Should fail at service level, not argument parsing
      expect(error?.message).to.not.match(/invalid.*vmid/i);
    });
  });

  describe('error messages', () => {
    it('should show configuration progress message', async () => {
      const {error, stdout} = await runCommand('proxmox vm cloudinit 100 --ssh-key=""');

      expect(error).to.exist;
      expect(stdout).to.include('Configuring cloud-init for VM 100');
    });

    it('should provide helpful error context for connection failures', async () => {
      const {error} = await runCommand('proxmox vm cloudinit 100 --ssh-key=""');

      expect(error).to.exist;
      expect(error?.message).to.include('Failed to configure cloud-init');
      // Error should contain some helpful context
      expect(error?.message.length).to.be.greaterThan(50);
    });
  });

  describe('combined flags', () => {
    it('should handle all flags together', async () => {
      const {error, stdout} = await runCommand(
        'proxmox vm cloudinit 250 --user ubuntu --password secure123 --ipconfig ip=10.0.10.100/24,gw=10.0.10.1 --upgrade --ssh-key "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDExampleKey user@host"',
      );

      expect(error).to.exist;
      expect(stdout).to.include('Configuring cloud-init for VM 250');
      expect(error?.message).to.include('Failed to configure cloud-init');
    });

    it('should handle multiple IPs in valid format', async () => {
      const {error} = await runCommand(
        'proxmox vm cloudinit 100 --ipconfig ip=192.168.1.100/24,gw=192.168.1.1 --ssh-key=""',
      );

      expect(error).to.exist;
      // Should not fail validation
      expect(error?.message).to.not.include('validation');
    });
  });

  describe('help and examples', () => {
    it('should display help text', async () => {
      const {stdout} = await runCommand('proxmox vm cloudinit --help');

      expect(stdout).to.include('Configure cloud-init settings for a Proxmox VM');
      expect(stdout).to.include('VMID');
      expect(stdout).to.include('--ipconfig');
      expect(stdout).to.include('--user');
      expect(stdout).to.include('--password');
      expect(stdout).to.include('--upgrade');
      expect(stdout).to.include('--ssh-key');
    });

    it('should include usage examples in help', async () => {
      const {stdout} = await runCommand('proxmox vm cloudinit --help');

      expect(stdout).to.include('EXAMPLES');
    });
  });
});
