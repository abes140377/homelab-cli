import {expect} from 'chai';

import {RepositoryError} from '../../src/errors/repository.error.js';
import {type ProxmoxTemplateDTO} from '../../src/models/proxmox-template.dto.js';
import {type IProxmoxRepository} from '../../src/repositories/interfaces/proxmox.repository.interface.js';
import {ProxmoxTemplateService} from '../../src/services/proxmox-template.service.js';
import {failure, success} from '../../src/utils/result.js';

describe('ProxmoxTemplateService', () => {
  describe('listTemplates', () => {
    it('should successfully list templates from repository', async () => {
      const mockTemplates: ProxmoxTemplateDTO[] = [
        {name: 'ubuntu-22.04', node: 'pve', template: 1, vmid: 100},
        {name: 'debian-12', node: 'pve', template: 1, vmid: 101},
      ];

      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => success(mockTemplates),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.length(2);
        expect(result.data[0].name).to.equal('ubuntu-22.04');
        expect(result.data[1].name).to.equal('debian-12');
      }
    });

    it('should sort templates by vmid ascending', async () => {
      const mockTemplates: ProxmoxTemplateDTO[] = [
        {name: 'template3', node: 'pve', template: 1, vmid: 300},
        {name: 'template1', node: 'pve', template: 1, vmid: 100},
        {name: 'template2', node: 'pve', template: 1, vmid: 200},
      ];

      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => success(mockTemplates),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.length(3);
        expect(result.data[0].vmid).to.equal(100);
        expect(result.data[1].vmid).to.equal(200);
        expect(result.data[2].vmid).to.equal(300);
        expect(result.data[0].name).to.equal('template1');
        expect(result.data[1].name).to.equal('template2');
        expect(result.data[2].name).to.equal('template3');
      }
    });

    it('should handle repository errors', async () => {
      const mockError = new RepositoryError('Connection failed');

      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => failure(mockError),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to retrieve templates from Proxmox');
      }
    });

    it('should handle validation errors for invalid data', async () => {
      // Invalid data: vmid is negative
      const invalidTemplates = [
        {name: 'invalid', node: 'pve', template: 1, vmid: -1},
      ] as ProxmoxTemplateDTO[];

      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => success(invalidTemplates),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Template data validation failed');
      }
    });

    it('should return empty array when no templates exist', async () => {
      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.length(0);
      }
    });

    it('should return Result type with success true on success', async () => {
      const mockTemplates: ProxmoxTemplateDTO[] = [
        {name: 'template1', node: 'pve', template: 1, vmid: 100},
      ];

      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => success(mockTemplates),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result).to.have.property('success');
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result).to.have.property('data');
        expect(result.data).to.be.an('array');
      }
    });

    it('should return Result type with success false on error', async () => {
      const mockError = new RepositoryError('Test error');

      const mockRepository: Partial<IProxmoxRepository> = {
        listTemplates: async () => failure(mockError),
      };

      const service = new ProxmoxTemplateService(mockRepository);
      const result = await service.listTemplates();

      expect(result).to.have.property('success');
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result).to.have.property('error');
        expect(result.error).to.be.instanceOf(Error);
      }
    });
  });
});
