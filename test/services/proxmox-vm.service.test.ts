import {expect} from 'chai';

import type {ProxmoxVMDTO} from '../../src/models/proxmox-vm.dto.js';
import type {IProxmoxRepository} from '../../src/repositories/interfaces/proxmox.repository.interface.js';

import {RepositoryError} from '../../src/errors/repository.error.js';
import {ProxmoxVMService} from '../../src/services/proxmox-vm.service.js';
import {failure, success} from '../../src/utils/result.js';

describe('ProxmoxVMService', () => {
  describe('listVMs', () => {
    it('should return sorted VMs when repository succeeds', async () => {
      // Arrange
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.11',
          name: 'vm-2',
          node: 'pve',
          status: 'running',
          vmid: 102,
        },
        {
          ipv4Address: '192.168.1.10',
          name: 'vm-1',
          node: 'pve',
          status: 'running',
          vmid: 101,
        },
        {
          ipv4Address: null,
          name: 'vm-3',
          node: 'pve',
          status: 'stopped',
          vmid: 103,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.listVMs('qemu');

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(3);
        expect(result.data[0].vmid).to.equal(101);
        expect(result.data[1].vmid).to.equal(102);
        expect(result.data[2].vmid).to.equal(103);
      }
    });

    it('should handle VMs with null IP addresses', async () => {
      // Arrange
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: null,
          name: 'vm-no-agent',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.listVMs('qemu');

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(1);
        expect(result.data[0].ipv4Address).to.be.null;
      }
    });

    it('should return ServiceError when repository fails', async () => {
      // Arrange
      const mockRepository: IProxmoxRepository = {
        listResources: async () => failure(new RepositoryError('Connection failed')),
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.listVMs('qemu');

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to retrieve qemu resources from Proxmox');
      }
    });

    it('should return ServiceError when validation fails', async () => {
      // Arrange
      const invalidVMs = [
        {
          // Missing required fields
          vmid: 'invalid',
        },
      ];

      const mockRepository: IProxmoxRepository = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        listResources: async () => success(invalidVMs as any),
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.listVMs('qemu');

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Resource data validation failed');
      }
    });

    it('should return empty array when no VMs exist', async () => {
      // Arrange
      const mockRepository: IProxmoxRepository = {
        listResources: async () => success([]),
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.listVMs('qemu');

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data).to.have.lengthOf(0);
      }
    });

    it('should maintain sort order for VMs with sequential VMIDs', async () => {
      // Arrange
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.15',
          name: 'vm-5',
          node: 'pve',
          status: 'running',
          vmid: 105,
        },
        {
          ipv4Address: '192.168.1.11',
          name: 'vm-1',
          node: 'pve',
          status: 'running',
          vmid: 101,
        },
        {
          ipv4Address: '192.168.1.13',
          name: 'vm-3',
          node: 'pve',
          status: 'running',
          vmid: 103,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.listVMs('qemu');

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.map((vm) => vm.vmid)).to.deep.equal([101, 103, 105]);
      }
    });
  });
});
