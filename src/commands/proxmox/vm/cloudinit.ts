import {Args, Flags} from '@oclif/core';
import * as fs from 'node:fs';

import {ProxmoxVMFactory} from '../../../factories/proxmox-vm.factory.js';
import {BaseCommand} from '../../../lib/base-command.js';
import {CloudInitConfigDTO} from '../../../models/cloud-init-config.dto.js';

export default class ProxmoxVmCloudinit extends BaseCommand<typeof ProxmoxVmCloudinit> {
  static args = {
    vmid: Args.integer({
      description: 'VM ID to configure',
      required: true,
    }),
  };
  static description = 'Configure cloud-init settings for a Proxmox VM';
  static examples = [
    `<%= config.bin %> <%= command.id %> 100
Configuring cloud-init for VM 100...
Successfully configured cloud-init for VM 100`,
    `<%= config.bin %> <%= command.id %> 100 --ipconfig ip=192.168.1.100/24
Configure VM with static IP address`,
    `<%= config.bin %> <%= command.id %> 100 --ipconfig ip=10.0.10.123/24,gw=10.0.10.1 --upgrade
Configure VM with static IP, gateway, and enable package upgrades`,
    `<%= config.bin %> <%= command.id %> 100 --user ubuntu --password mypassword
Configure VM with custom user credentials`,
  ];
  static flags = {
    ipconfig: Flags.string({
      default: 'ip=dhcp',
      description: 'IPv4 configuration for eth0 (ip=dhcp or ip=X.X.X.X/YY[,gw=X.X.X.X])',
    }),
    password: Flags.string({
      default: '',
      description: 'Password for the default user (empty = no password)',
    }),
    'ssh-key': Flags.string({
      default: './keys/admin_id_ecdsa.pub',
      description: 'SSH public key or path to key file',
    }),
    upgrade: Flags.boolean({
      default: false,
      description: 'Automatically upgrade packages on first boot',
    }),
    user: Flags.string({
      default: 'admin',
      description: 'Username for the default user',
    }),
  };

  async run(): Promise<void> {
    await this.parse(ProxmoxVmCloudinit);

    const {vmid} = this.args;
    const {ipconfig, password, 'ssh-key': sshKeyInput, upgrade, user} = this.flags;

    // Handle SSH key: detect if file path or direct content
    let sshKeys = sshKeyInput;
    if (sshKeyInput.startsWith('./') || sshKeyInput.startsWith('/')) {
      // Treat as file path
      try {
        sshKeys = fs.readFileSync(sshKeyInput, 'utf8').trim();
      } catch {
        this.error(`Failed to read SSH key file: ${sshKeyInput}`, {
          exit: 1,
        });
      }
    }

    // Create CloudInitConfigDTO
    const config = new CloudInitConfigDTO(user, password, sshKeys, ipconfig, upgrade);

    // Display progress message
    this.log(`Configuring cloud-init for VM ${vmid}...`);

    // Get service and call configureCloudInit
    const service = ProxmoxVMFactory.createProxmoxVMService();
    const result = await service.configureCloudInit(vmid, config);

    if (!result.success) {
      // Build detailed error message
      let errorMsg = `Failed to configure cloud-init: ${result.error.message}`;

      // Include Zod validation errors if available
      if (result.error.context?.zodError) {
        const zodError = result.error.context.zodError as {
          errors?: Array<{message: string; path: string[]}>;
        };
        if (zodError.errors && zodError.errors.length > 0) {
          errorMsg += '\nValidation errors:';
          for (const err of zodError.errors) {
            errorMsg += `\n  - ${err.path.join('.')}: ${err.message}`;
          }
        }
      }

      // Include cause if available
      if (result.error.context?.cause) {
        const cause = result.error.context.cause as {context?: Record<string, unknown>; message: string};
        errorMsg += `\nCause: ${cause.message}`;

        // Include cause's context if available
        if (cause.context) {
          errorMsg += `\nCause Context: ${JSON.stringify(cause.context, null, 2)}`;
        }
      }

      // Include context details if available
      if (result.error.context?.context) {
        errorMsg += `\nContext: ${JSON.stringify(result.error.context.context, null, 2)}`;
      }

      this.error(errorMsg, {
        exit: 1,
      });
    }

    // Display success message
    this.log(`Successfully configured cloud-init for VM ${vmid}`);
  }
}
