import { Args } from '@oclif/core'

import { ProxmoxVMFactory } from '../../../factories/proxmox-vm.factory.js'
import { BaseCommand } from '../../../lib/base-command.js'

export default class ProxmoxVmCreate extends BaseCommand<typeof ProxmoxVmCreate> {
  static args = {
    'template-name': Args.string({
      description: 'Name of the template to clone from',
      required: true,
    }),
    'vm-name': Args.string({
      description: 'Name for the new VM',
      required: true,
    }),
  }
  static description = 'Create a new VM from a template'
  static examples = [
    `<%= config.bin %> <%= command.id %> tpl-linux-ubuntu-server-24.04 my-server
Creating VM 'my-server' from template 'tpl-linux-ubuntu-server-24.04'...
Successfully created VM 200 'my-server' on node 'pve1'`,
  ]

  async run(): Promise<void> {
    await this.parse(ProxmoxVmCreate)

    const vmName = this.args['vm-name']
    const templateName = this.args['template-name']

    // Display progress message
    this.log(`Creating VM '${vmName}' from template '${templateName}'...`)

    // Get service and call createVmFromTemplate
    const service = ProxmoxVMFactory.createProxmoxVMService()
    const result = await service.createVmFromTemplate(vmName, templateName)

    if (!result.success) {
      this.error(`Failed to create VM: ${result.error.message}`, {
        exit: 1,
      })
    }

    const { name, node, vmid } = result.data

    // Display success message
    this.log(`Successfully created VM ${vmid} '${name}' on node '${node}'`)
  }
}
