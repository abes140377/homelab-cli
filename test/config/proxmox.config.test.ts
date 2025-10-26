import {expect} from 'chai';

import {loadProxmoxConfig} from '../../src/config/proxmox.config.js';

describe('Proxmox Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = {...originalEnv};
    delete process.env.PROXMOX_HOST;
    delete process.env.PROXMOX_API_TOKEN;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadProxmoxConfig', () => {
    it('should load valid configuration from environment', () => {
      process.env.PROXMOX_HOST = 'https://proxmox.home.sflab.io:8006';
      process.env.PROXMOX_API_TOKEN = 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      const config = loadProxmoxConfig();

      expect(config).to.deep.equal({
        apiToken: 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce',
        host: 'https://proxmox.home.sflab.io:8006',
      });
    });

    it('should throw error when PROXMOX_HOST is missing', () => {
      process.env.PROXMOX_API_TOKEN = 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_HOST environment variable is required');
    });

    it('should throw error when PROXMOX_API_TOKEN is missing', () => {
      process.env.PROXMOX_HOST = 'https://proxmox.home.sflab.io:8006';

      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_API_TOKEN environment variable is required');
    });

    it('should throw error when PROXMOX_HOST is not a valid URL', () => {
      process.env.PROXMOX_HOST = 'not-a-valid-url';
      process.env.PROXMOX_API_TOKEN = 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      expect(() => loadProxmoxConfig()).to.throw('Proxmox configuration validation failed');
      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_HOST must be a valid URL');
    });

    it('should throw error when PROXMOX_HOST does not start with http:// or https://', () => {
      process.env.PROXMOX_HOST = 'ftp://proxmox.home.sflab.io:8006';
      process.env.PROXMOX_API_TOKEN = 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      expect(() => loadProxmoxConfig()).to.throw('Proxmox configuration validation failed');
      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_HOST must start with https:// or http://');
    });

    it('should throw error when PROXMOX_API_TOKEN is missing ! separator', () => {
      process.env.PROXMOX_HOST = 'https://proxmox.home.sflab.io:8006';
      process.env.PROXMOX_API_TOKEN = 'root@pam-homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      expect(() => loadProxmoxConfig()).to.throw('Proxmox configuration validation failed');
      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_API_TOKEN must be in format user@realm!tokenid=secret');
    });

    it('should throw error when PROXMOX_API_TOKEN is missing = separator', () => {
      process.env.PROXMOX_HOST = 'https://proxmox.home.sflab.io:8006';
      process.env.PROXMOX_API_TOKEN = 'root@pam!homelabcli-bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      expect(() => loadProxmoxConfig()).to.throw('Proxmox configuration validation failed');
      expect(() => loadProxmoxConfig()).to.throw('PROXMOX_API_TOKEN must be in format user@realm!tokenid=secret');
    });

    it('should accept http:// URLs for development', () => {
      process.env.PROXMOX_HOST = 'http://localhost:8006';
      process.env.PROXMOX_API_TOKEN = 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce';

      const config = loadProxmoxConfig();

      expect(config.host).to.equal('http://localhost:8006');
    });
  });
});
