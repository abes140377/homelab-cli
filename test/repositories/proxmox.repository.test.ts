/* eslint-disable n/no-unsupported-features/node-builtins */
/* eslint-disable unicorn/no-useless-promise-resolve-reject */
import {expect} from 'chai';

import {type ProxmoxConfig} from '../../src/config/proxmox.config.js';
import {ProxmoxRepository} from '../../src/repositories/proxmox.repository.js';

describe('ProxmoxRepository', () => {
  const mockConfig: ProxmoxConfig = {
    apiToken: 'root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce',
    host: 'https://proxmox.home.sflab.io:8006',
  };

  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  });

  describe('listTemplates', () => {
    it('should successfully fetch and parse templates', async () => {
      // Mock fetch response
      globalThis.fetch = async () => ({
        json: async () =>
          Promise.resolve({
            data: [
              {name: 'ubuntu-22.04', template: 1, vmid: 100},
              {name: 'debian-12', template: 1, vmid: 101},
              {name: 'running-vm', template: 0, vmid: 200}, // Not a template
            ],
          }),
        ok: true,
        status: 200,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.length(2);
        expect(result.data[0]).to.deep.equal({
          name: 'ubuntu-22.04',
          template: 1,
          vmid: 100,
        });
        expect(result.data[1]).to.deep.equal({
          name: 'debian-12',
          template: 1,
          vmid: 101,
        });
      }
    });

    it('should correctly parse API token for Authorization header', async () => {
      let capturedHeaders: Record<string, string> | undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      globalThis.fetch = async (_url: any, init?: any) => {
        capturedHeaders = init?.headers;
        return {
          json: async () => Promise.resolve({data: []}),
          ok: true,
          status: 200,
        } as unknown as Response;
      };

      const repository = new ProxmoxRepository(mockConfig);
      await repository.listTemplates();

      expect(capturedHeaders).to.deep.include({
        Authorization: 'PVEAPIToken=homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce',
      });
    });

    it('should filter only templates (template === 1)', async () => {
      globalThis.fetch = async () => ({
        json: async () =>
          Promise.resolve({
            data: [
              {name: 'template1', template: 1, vmid: 100},
              {name: 'vm1', template: 0, vmid: 200},
              {name: 'template2', template: 1, vmid: 101},
              {name: 'vm2', vmid: 201}, // No template field
            ],
          }),
        ok: true,
        status: 200,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.length(2);
        expect(result.data[0].name).to.equal('template1');
        expect(result.data[1].name).to.equal('template2');
      }
    });

    it('should handle network errors', async () => {
      globalThis.fetch = async () => {
        throw new Error('Network error');
      };

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to connect to Proxmox API');
      }
    });

    it('should handle HTTP 401 authentication errors', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 401,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Authentication failed');
      }
    });

    it('should handle HTTP 403 authentication errors', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 403,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Authentication failed');
      }
    });

    it('should handle HTTP 404 errors', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Proxmox API endpoint not found');
      }
    });

    it('should handle HTTP 5xx server errors', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Proxmox server error');
      }
    });

    it('should handle invalid JSON response', async () => {
      globalThis.fetch = async () => ({
        async json() {
          throw new Error('Invalid JSON');
        },
        ok: true,
        status: 200,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Invalid response from Proxmox API');
      }
    });

    it('should handle unexpected response structure', async () => {
      globalThis.fetch = async () => ({
        json: async () => Promise.resolve({unexpected: 'structure'}),
        ok: true,
        status: 200,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Unexpected API response format');
      }
    });

    it('should handle invalid API token format', async () => {
      const invalidConfig: ProxmoxConfig = {
        apiToken: 'invalid-token-without-separator',
        host: 'https://proxmox.home.sflab.io:8006',
      };

      const repository = new ProxmoxRepository(invalidConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Invalid API token format');
      }
    });

    it('should return empty array when no templates exist', async () => {
      globalThis.fetch = async () => ({
        json: async () =>
          Promise.resolve({
            data: [
              {name: 'vm1', template: 0, vmid: 200},
              {name: 'vm2', template: 0, vmid: 201},
            ],
          }),
        ok: true,
        status: 200,
      }) as unknown as Response;

      const repository = new ProxmoxRepository(mockConfig);
      const result = await repository.listTemplates();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.length(0);
      }
    });
  });
});
