import {expect} from 'chai';

import type {ProxmoxVMDTO} from '../../src/models/proxmox-vm.dto.js';
import type {IProxmoxRepository} from '../../src/repositories/interfaces/proxmox.repository.interface.js';

import {RepositoryError} from '../../src/errors/repository.error.js';
import {CloudInitConfigDTO} from '../../src/models/cloud-init-config.dto.js';
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

  describe('configureCloudInit', () => {
    it('should successfully configure cloud-init with valid configuration', async () => {
      // Arrange
      const vmid = 100;
      const config = new CloudInitConfigDTO(
        'admin',
        'secure-password',
        'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey user@host',
        'ip=192.168.1.100/24,gw=192.168.1.1',
        true,
      );

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve-node-1',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async setVMConfig(node, vmidParam, apiParams) {
          // Verify the parameters are correct
          expect(node).to.equal('pve-node-1');
          expect(vmidParam).to.equal(100);
          expect(apiParams).to.deep.equal({
            cipassword: 'secure-password',
            ciupgrade: 1,
            ciuser: 'admin',
            ipconfig0: 'ip=192.168.1.100/24,gw=192.168.1.1',
            sshkeys: encodeURIComponent('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey user@host'),
          });
          return success();
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.true;
    });

    it('should handle Zod validation failure for empty username', async () => {
      // Arrange
      const vmid = 100;
      const config = new CloudInitConfigDTO(
        '', // Invalid: empty username
        '',
        '',
        'ip=dhcp',
        false,
      );

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success([]),
        listTemplates: async () => success([]),
        setVMConfig: async () => success(),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Cloud-init configuration validation failed');
        expect(result.error.context?.zodError).to.exist;
      }
    });

    it('should handle Zod validation failure for invalid IP format', async () => {
      // Arrange
      const vmid = 100;
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=invalid-ip-address', // Invalid IP format
        false,
      );

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success([]),
        listTemplates: async () => success([]),
        setVMConfig: async () => success(),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Cloud-init configuration validation failed');
        expect(result.error.context?.zodError).to.exist;
      }
    });

    it('should handle node resolution failure when VM not found', async () => {
      // Arrange
      const vmid = 999;
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        false,
      );

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        setVMConfig: async () => success(),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('VM 999 not found');
        expect(result.error.context?.context?.vmid).to.equal(999);
        expect(result.error.context?.context?.availableVmids).to.deep.equal([100]);
      }
    });

    it('should handle repository error during configuration', async () => {
      // Arrange
      const vmid = 100;
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        false,
      );

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        setVMConfig: async () => failure(new RepositoryError('API connection failed')),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to configure cloud-init');
        expect(result.error.context?.cause).to.be.instanceOf(RepositoryError);
      }
    });

    it('should URL-encode SSH keys correctly', async () => {
      // Arrange
      const vmid = 100;
      const sshKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKey user@host with spaces';
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        sshKey,
        'ip=dhcp',
        false,
      );

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async setVMConfig(node, vmidParam, apiParams) {
          // Verify SSH key is URL-encoded
          expect(apiParams.sshkeys).to.equal(encodeURIComponent(sshKey));
          expect(apiParams.sshkeys).to.include('%20'); // Space should be encoded
          expect(apiParams.sshkeys).to.not.include(' '); // No raw spaces
          return success();
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.true;
    });

    it('should convert upgrade boolean to integer correctly', async () => {
      // Arrange
      const vmid = 100;

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      // Test with upgrade = true
      const configWithUpgrade = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        true,
      );

      let mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async setVMConfig(node, vmidParam, apiParams) {
          expect(apiParams.ciupgrade).to.equal(1);
          expect(typeof apiParams.ciupgrade).to.equal('number');
          return success();
        },
      };

      let service = new ProxmoxVMService(mockRepository);
      let result = await service.configureCloudInit(vmid, configWithUpgrade);
      expect(result.success).to.be.true;

      // Test with upgrade = false
      const configWithoutUpgrade = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        false,
      );

      mockRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async setVMConfig(node, vmidParam, apiParams) {
          expect(apiParams.ciupgrade).to.equal(0);
          expect(typeof apiParams.ciupgrade).to.equal('number');
          return success();
        },
      };

      service = new ProxmoxVMService(mockRepository);
      result = await service.configureCloudInit(vmid, configWithoutUpgrade);
      expect(result.success).to.be.true;
    });
  });

  describe('resolveNodeForVmid (private method tested via configureCloudInit)', () => {
    it('should successfully resolve node for existing VM', async () => {
      // Arrange
      const vmid = 100;
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        false,
      );

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve-node-1',
          status: 'running',
          vmid: 100,
        },
        {
          ipv4Address: '192.168.1.101',
          name: 'test-vm-2',
          node: 'pve-node-2',
          status: 'running',
          vmid: 101,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async setVMConfig(node) {
          // Verify correct node was resolved
          expect(node).to.equal('pve-node-1');
          return success();
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.true;
    });

    it('should return error when VM not found', async () => {
      // Arrange
      const vmid = 999;
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        false,
      );

      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        setVMConfig: async () => success(),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('VM 999 not found');
      }
    });

    it('should handle repository error during VM lookup', async () => {
      // Arrange
      const vmid = 100;
      const config = new CloudInitConfigDTO(
        'admin',
        '',
        '',
        'ip=dhcp',
        false,
      );

      const mockRepository: IProxmoxRepository = {
        listResources: async () => failure(new RepositoryError('Cluster query failed')),
        listTemplates: async () => success([]),
        setVMConfig: async () => success(),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.configureCloudInit(vmid, config);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to query cluster resources');
        expect(result.error.context?.cause).to.be.instanceOf(RepositoryError);
      }
    });
  });

  describe('startVM', () => {
    it('should successfully start a VM', async () => {
      // Arrange
      const vmid = 100;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve-node-1',
          status: 'stopped',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async startVM(node, vmidParam) {
          // Verify correct parameters
          expect(node).to.equal('pve-node-1');
          expect(vmidParam).to.equal(100);
          return success('UPID:pve-node-1:00001234:00005678:ABCD1234:qmstart:100:root@pam:');
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.vmid).to.equal(100);
        expect(result.data.name).to.equal('test-vm');
        expect(result.data.node).to.equal('pve-node-1');
      }
    });

    it('should handle VM not found error', async () => {
      // Arrange
      const vmid = 999;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'stopped',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        startVM: async () => success('UPID:pve:00001234:00005678:ABCD1234:qmstart:100:root@pam:'),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('VM 999 not found');
        expect(result.error.context?.context?.vmid).to.equal(999);
        expect(result.error.context?.context?.message).to.include('homelab proxmox vm list');
      }
    });

    it('should handle repository error during cluster query', async () => {
      // Arrange
      const vmid = 100;

      const mockRepository: IProxmoxRepository = {
        listResources: async () => failure(new RepositoryError('Connection failed')),
        listTemplates: async () => success([]),
        startVM: async () => success('UPID:pve:00001234:00005678:ABCD1234:qmstart:100:root@pam:'),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to query cluster resources');
        expect(result.error.context?.cause).to.be.instanceOf(RepositoryError);
      }
    });

    it('should handle repository error during start operation', async () => {
      // Arrange
      const vmid = 100;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'stopped',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        startVM: async () => failure(new RepositoryError('Failed to start VM: API error')),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to start VM: API error');
        expect(result.error.context?.cause).to.be.instanceOf(RepositoryError);
        expect(result.error.context?.context?.vmid).to.equal(100);
        expect(result.error.context?.context?.name).to.equal('test-vm');
        expect(result.error.context?.context?.node).to.equal('pve');
      }
    });

    it('should preserve VM details in error context', async () => {
      // Arrange
      const vmid = 250;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '10.0.10.50',
          name: 'production-vm',
          node: 'pve-node-2',
          status: 'stopped',
          vmid: 250,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        startVM: async () => failure(new RepositoryError('Network timeout')),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.context?.context?.vmid).to.equal(250);
        expect(result.error.context?.context?.name).to.equal('production-vm');
        expect(result.error.context?.context?.node).to.equal('pve-node-2');
      }
    });

    it('should handle multiple VMs with same name on different nodes', async () => {
      // Arrange
      const vmid = 101;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve-node-1',
          status: 'stopped',
          vmid: 100,
        },
        {
          ipv4Address: '192.168.1.101',
          name: 'test-vm',
          node: 'pve-node-2',
          status: 'stopped',
          vmid: 101,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async startVM(node, vmidParam) {
          // Verify correct node is selected for the specific VMID
          expect(node).to.equal('pve-node-2');
          expect(vmidParam).to.equal(101);
          return success('UPID:pve-node-2:00001234:00005678:ABCD1234:qmstart:101:root@pam:');
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.vmid).to.equal(101);
        expect(result.data.node).to.equal('pve-node-2');
      }
    });

    it('should pass through repository error message as-is', async () => {
      // Arrange
      const vmid = 100;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'stopped',
          vmid: 100,
        },
      ];

      const repositoryErrorMessage = 'Failed to start VM: VM is locked';
      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        startVM: async () => failure(new RepositoryError(repositoryErrorMessage)),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.startVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        // Service should pass through repository error message unchanged
        expect(result.error.message).to.equal(repositoryErrorMessage);
      }
    });
  });

  describe('stopVM', () => {
    it('should successfully stop a VM', async () => {
      // Arrange
      const vmid = 100;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve-node-1',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async stopVM(node, vmidParam) {
          // Verify correct parameters
          expect(node).to.equal('pve-node-1');
          expect(vmidParam).to.equal(100);
          return success('UPID:pve-node-1:00001234:00005678:ABCD1234:qmshutdown:100:root@pam:');
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.vmid).to.equal(100);
        expect(result.data.name).to.equal('test-vm');
        expect(result.data.node).to.equal('pve-node-1');
      }
    });

    it('should handle VM not found error', async () => {
      // Arrange
      const vmid = 999;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        stopVM: async () => success('UPID:pve:00001234:00005678:ABCD1234:qmshutdown:100:root@pam:'),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('VM 999 not found');
        expect(result.error.context?.context?.vmid).to.equal(999);
        expect(result.error.context?.context?.message).to.include('homelab proxmox vm list');
      }
    });

    it('should handle repository error during cluster query', async () => {
      // Arrange
      const vmid = 100;

      const mockRepository: IProxmoxRepository = {
        listResources: async () => failure(new RepositoryError('Connection failed')),
        listTemplates: async () => success([]),
        stopVM: async () => success('UPID:pve:00001234:00005678:ABCD1234:qmshutdown:100:root@pam:'),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to query cluster resources');
        expect(result.error.context?.cause).to.be.instanceOf(RepositoryError);
      }
    });

    it('should handle repository error during stop operation', async () => {
      // Arrange
      const vmid = 100;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        stopVM: async () => failure(new RepositoryError('Failed to stop VM: API error')),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.message).to.include('Failed to stop VM: API error');
        expect(result.error.context?.cause).to.be.instanceOf(RepositoryError);
        expect(result.error.context?.context?.vmid).to.equal(100);
        expect(result.error.context?.context?.name).to.equal('test-vm');
        expect(result.error.context?.context?.node).to.equal('pve');
      }
    });

    it('should preserve VM details in error context', async () => {
      // Arrange
      const vmid = 250;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '10.0.10.50',
          name: 'production-vm',
          node: 'pve-node-2',
          status: 'running',
          vmid: 250,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        stopVM: async () => failure(new RepositoryError('Network timeout')),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.context?.context?.vmid).to.equal(250);
        expect(result.error.context?.context?.name).to.equal('production-vm');
        expect(result.error.context?.context?.node).to.equal('pve-node-2');
      }
    });

    it('should handle multiple VMs with same name on different nodes', async () => {
      // Arrange
      const vmid = 101;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve-node-1',
          status: 'running',
          vmid: 100,
        },
        {
          ipv4Address: '192.168.1.101',
          name: 'test-vm',
          node: 'pve-node-2',
          status: 'running',
          vmid: 101,
        },
      ];

      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        async stopVM(node, vmidParam) {
          // Verify correct node is selected for the specific VMID
          expect(node).to.equal('pve-node-2');
          expect(vmidParam).to.equal(101);
          return success('UPID:pve-node-2:00001234:00005678:ABCD1234:qmshutdown:101:root@pam:');
        },
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.true;
      if (result.success) {
        expect(result.data.vmid).to.equal(101);
        expect(result.data.node).to.equal('pve-node-2');
      }
    });

    it('should pass through repository error message as-is', async () => {
      // Arrange
      const vmid = 100;
      const mockVMs: ProxmoxVMDTO[] = [
        {
          ipv4Address: '192.168.1.100',
          name: 'test-vm',
          node: 'pve',
          status: 'running',
          vmid: 100,
        },
      ];

      const repositoryErrorMessage = 'Failed to stop VM: VM is locked';
      const mockRepository: IProxmoxRepository = {
        listResources: async () => success(mockVMs),
        listTemplates: async () => success([]),
        stopVM: async () => failure(new RepositoryError(repositoryErrorMessage)),
      };

      const service = new ProxmoxVMService(mockRepository);

      // Act
      const result = await service.stopVM(vmid);

      // Assert
      expect(result.success).to.be.false;
      if (!result.success) {
        // Service should pass through repository error message unchanged
        expect(result.error.message).to.equal(repositoryErrorMessage);
      }
    });
  });
});
