import {expect} from 'chai';

import {loadProxmoxConfig} from '../../src/config/proxmox.config.js';

describe('Proxmox Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv};
    delete process.env.PROXMOX_USER;
    delete process.env.PROXMOX_REALM;
    delete process.env.PROXMOX_TOKEN_KEY;
    delete process.env.PROXMOX_TOKEN_SECRET;
    delete process.env.PROXMOX_HOST;
    delete process.env.PROXMOX_PORT;
    delete process.env.PROXMOX_REJECT_UNAUTHORIZED;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadProxmoxConfig', () => {
    it('should load valid configuration with all six variables', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';
      process.env.PROXMOX_PORT = '8006';

      const config = loadProxmoxConfig();

      expect(config).to.deep.equal({
        host: 'proxmox.home.sflab.io',
        port: 8006,
        realm: 'pam',
        rejectUnauthorized: true,
        tokenKey: 'homelabcli',
        tokenSecret: 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce',
        user: 'root',
      });
    });

    it('should use default port 8006 when PROXMOX_PORT is omitted', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      const config = loadProxmoxConfig();

      expect(config.port).to.equal(8006);
    });

    it('should throw error when PROXMOX_USER is missing', () => {
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_USER environment variable is required');
    });

    it('should throw error when PROXMOX_REALM is missing', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_REALM environment variable is required');
    });

    it('should throw error when PROXMOX_TOKEN_KEY is missing', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_TOKEN_KEY environment variable is required');
    });

    it('should throw error when PROXMOX_TOKEN_SECRET is missing', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_TOKEN_SECRET environment variable is required');
    });

    it('should throw error when PROXMOX_HOST is missing', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_HOST environment variable is required');
    });

    it('should throw error when PROXMOX_PORT is not a valid integer', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';
      process.env.PROXMOX_PORT = 'not-a-number';

      expect(() => loadProxmoxConfig()).to.throw('Proxmox configuration validation failed');
    });

    it('should throw error when PROXMOX_USER is empty', () => {
      process.env.PROXMOX_USER = '';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      // Empty string is falsy, so it triggers the "required" check
      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_USER environment variable is required');
    });

    it('should throw error when PROXMOX_TOKEN_SECRET is not a valid UUID', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'not-a-valid-uuid';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      expect(() => loadProxmoxConfig()).to.throw('Proxmox configuration validation failed');
      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_TOKEN_SECRET must be a valid UUID format');
    });

    it('should accept custom port configuration', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.local';
      process.env.PROXMOX_PORT = '8443';

      const config = loadProxmoxConfig();

      expect(config.host).to.equal('proxmox.local');
      expect(config.port).to.equal(8443);
    });

    it('should accept custom realm configuration', () => {
      process.env.PROXMOX_USER = 'admin';
      process.env.PROXMOX_REALM = 'pve';
      process.env.PROXMOX_TOKEN_KEY = 'mytoken';
      process.env.PROXMOX_TOKEN_SECRET = '12345678-1234-1234-1234-123456789abc';
      process.env.PROXMOX_HOST = 'proxmox.example.com';

      const config = loadProxmoxConfig();

      expect(config.user).to.equal('admin');
      expect(config.realm).to.equal('pve');
      expect(config.tokenKey).to.equal('mytoken');
    });

    it('should default rejectUnauthorized to true when PROXMOX_REJECT_UNAUTHORIZED is omitted', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';

      const config = loadProxmoxConfig();

      expect(config.rejectUnauthorized).to.equal(true);
    });

    it('should set rejectUnauthorized to false when PROXMOX_REJECT_UNAUTHORIZED is "false"', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';
      process.env.PROXMOX_REJECT_UNAUTHORIZED = 'false';

      const config = loadProxmoxConfig();

      expect(config.rejectUnauthorized).to.equal(false);
    });

    it('should set rejectUnauthorized to true when PROXMOX_REJECT_UNAUTHORIZED is "true"', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';
      process.env.PROXMOX_REJECT_UNAUTHORIZED = 'true';

      const config = loadProxmoxConfig();

      expect(config.rejectUnauthorized).to.equal(true);
    });

    it('should set rejectUnauthorized to true for any truthy value', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';
      process.env.PROXMOX_REJECT_UNAUTHORIZED = 'yes';

      const config = loadProxmoxConfig();

      expect(config.rejectUnauthorized).to.equal(true);
    });

    it('should set rejectUnauthorized to false only when explicitly set to "false"', () => {
      process.env.PROXMOX_USER = 'root';
      process.env.PROXMOX_REALM = 'pam';
      process.env.PROXMOX_TOKEN_KEY = 'homelabcli';
      process.env.PROXMOX_TOKEN_SECRET = 'bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';
      process.env.PROXMOX_HOST = 'proxmox.home.sflab.io';
      process.env.PROXMOX_REJECT_UNAUTHORIZED = 'FALSE';

      const config = loadProxmoxConfig();

      expect(config.rejectUnauthorized).to.equal(false);
    });
  });
});
