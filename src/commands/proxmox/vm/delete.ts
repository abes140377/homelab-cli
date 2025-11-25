import {Args, Flags} from '@oclif/core'
import Table from 'cli-table3'

import {ProxmoxVMFactory} from '../../../factories/proxmox-vm.factory.js'
import {BaseCommand} from '../../../lib/base-command.js'
import {promptForConfirmation, promptForMultipleSelections} from '../../../utils/prompts.js'

export default class ProxmoxVmDelete extends BaseCommand<typeof ProxmoxVmDelete> {
  static args = {
    vmids: Args.integer({
      description: 'VM IDs to delete',
      required: false,
    }),
  }
  static description = 'Delete one or more Proxmox VMs'
  static examples = [
    `<%= config.bin %> <%= command.id %> 100
Deleting VM 100...
Successfully deleted VM 100 'web-server' from node 'pve1'`,
    `<%= config.bin %> <%= command.id %> 100 101 102
Deleting 3 VMs...
Successfully deleted 3 VMs`,
    `<%= config.bin %> <%= command.id %> 100 --force
Successfully deleted VM 100 'web-server' from node 'pve1'`,
    `<%= config.bin %> <%= command.id %>
# Interactive mode - select VMs from list`,
    `<%= config.bin %> <%= command.id %> 100 --json --force
{
  "vmid": 100,
  "name": "web-server",
  "node": "pve1",
  "status": "deleted"
}`,
  ]
  static flags = {
    force: Flags.boolean({
      char: 'f',
      default: false,
      description: 'Skip confirmation prompts',
    }),
  }
  static strict = false

  async run(): Promise<
    | void
    | {deleted: Array<{name: string; node: string; vmid: number}>; failed: Array<{error: string; vmid: number}>}
    | {name: string; node: string; status: string; vmid: number}
  > {
    await this.parse(ProxmoxVmDelete)

    const {force} = this.flags
    const jsonMode = this.jsonEnabled()

    // Get VMIDs from arguments (variadic)
    // Parse argv as integers, filter out any invalid values
    const providedVmids = this.argv
      .map((arg) => Number.parseInt(arg, 10))
      .filter((vmid) => !Number.isNaN(vmid))

    // Get service
    const service = ProxmoxVMFactory.createProxmoxVMService()

    let vmidsToDelete: number[] = []

    // Interactive mode if no VMIDs provided
    if (providedVmids.length === 0) {
      if (force) {
        this.error('Force mode requires explicit VM IDs', {exit: 1})
      }

      // List all VMs
      const listResult = await service.listVMs('qemu')
      if (!listResult.success) {
        this.error(`Failed to list VMs: ${listResult.error.message}`, {exit: 1})
      }

      const vms = listResult.data

      if (vms.length === 0) {
        if (!jsonMode) {
          this.log('No VMs available to delete')
        }

        return
      }

      // Prompt for VM selection
      const selectionResult = await promptForMultipleSelections({
        choices: vms.map((vm) => ({
          label: `${vm.vmid} - ${vm.name} (${vm.node}, ${vm.status})`,
          value: vm.vmid,
        })),
        message: 'Select VMs to delete (use space to toggle, enter to confirm):',
      })

      if (!selectionResult.success) {
        this.error('Selection cancelled', {exit: 0})
      }

      vmidsToDelete = selectionResult.data.map((item) => item.value)

      if (vmidsToDelete.length === 0) {
        if (!jsonMode) {
          this.log('No VMs selected')
        }

        return
      }
    } else {
      vmidsToDelete = providedVmids
    }

    // Load VM details for all VMIDs
    const listResult = await service.listVMs('qemu')
    if (!listResult.success) {
      this.error(`Failed to list VMs: ${listResult.error.message}`, {exit: 1})
    }

    const allVms = listResult.data
    const vmsToDelete = vmidsToDelete
      .map((vmid) => allVms.find((vm) => vm.vmid === vmid))
      .filter((vm) => vm !== undefined)

    // Check if any VMIDs not found
    const notFoundVmids = vmidsToDelete.filter((vmid) => !allVms.some((vm) => vm.vmid === vmid))

    if (notFoundVmids.length > 0) {
      const errorMsg = `VM${notFoundVmids.length > 1 ? 's' : ''} ${notFoundVmids.join(', ')} not found. Use 'homelab proxmox vm list' to see available VMs.`
      if (jsonMode) {
        return {
          deleted: [],
          failed: notFoundVmids.map((vmid) => ({error: 'VM not found', vmid})),
        }
      }

      this.error(errorMsg, {exit: 1})
    }

    // Display VM details before confirmation
    if (!jsonMode && !force) {
      const table = new Table({
        head: ['VMID', 'Name', 'Node', 'Status'],
      })

      for (const vm of vmsToDelete) {
        table.push([vm.vmid.toString(), vm.name, vm.node, vm.status])
      }

      this.log('\nThe following VMs will be deleted:\n')
      this.log(table.toString())
      this.log(
        '\n⚠️  WARNING: This action cannot be undone. All VM data will be permanently deleted.\n',
      )
    }

    // Confirmation prompt (skip if force or JSON mode)
    if (!force && !jsonMode) {
      const confirmResult = await promptForConfirmation({
        initial: false,
        message: `Are you sure you want to delete ${vmsToDelete.length === 1 ? 'this VM' : 'these VMs'}?`,
      })

      if (!confirmResult.success || !confirmResult.data) {
        this.log('Deletion cancelled')
        return
      }
    }

    // Delete VMs sequentially
    const deleted: Array<{name: string; node: string; vmid: number}> = []
    const failed: Array<{error: string; vmid: number}> = []

    // Note: Sequential deletion with await in loop is intentional for safety
    // and to provide progress feedback. Parallel deletion could overwhelm
    // the Proxmox API and make error tracking difficult.
    /* eslint-disable no-await-in-loop */
    for (const [index, vm] of vmsToDelete.entries()) {
      const {vmid} = vm

      // Show progress for multiple VMs (not in JSON mode)
      if (!jsonMode && vmsToDelete.length > 1) {
        this.log(`[${index + 1}/${vmsToDelete.length}] Deleting VM ${vmid} '${vm.name}' on node '${vm.node}'...`)
      } else if (!jsonMode) {
        this.log(`Deleting VM ${vmid} '${vm.name}' on node '${vm.node}'...`)
      }

      const deleteResult = await service.deleteVM(vmid)

      if (deleteResult.success) {
        deleted.push(deleteResult.data)
        if (!jsonMode && vmsToDelete.length === 1) {
          this.log(`Successfully deleted VM ${vmid} '${deleteResult.data.name}' from node '${deleteResult.data.node}'`)
        }
      } else {
        failed.push({error: deleteResult.error.message, vmid})
        if (!jsonMode && vmsToDelete.length === 1) {
          // Display error message as-is (it's already user-friendly from service layer)
          this.error(deleteResult.error.message, {exit: 1})
        }
      }
    }
    /* eslint-enable no-await-in-loop */

    // Handle JSON output
    if (jsonMode) {
      if (vmsToDelete.length === 1) {
        if (deleted.length === 1) {
          return {
            name: deleted[0].name,
            node: deleted[0].node,
            status: 'deleted',
            vmid: deleted[0].vmid,
          }
        }

        return {
          deleted: [],
          failed,
        }
      }

      return {
        deleted,
        failed,
      }
    }

    // Display summary for multiple VMs
    if (vmsToDelete.length > 1) {
      this.log('\nDeletion Summary:')
      this.log(`  Successful: ${deleted.length}`)
      this.log(`  Failed: ${failed.length}`)

      if (failed.length > 0) {
        this.log('\nFailed deletions:')
        for (const fail of failed) {
          this.log(`  VM ${fail.vmid}: ${fail.error}`)
        }
      }
    }

    // Exit with error if any deletions failed
    if (failed.length > 0) {
      this.error('Some VM deletions failed', {exit: 1})
    }
  }
}
