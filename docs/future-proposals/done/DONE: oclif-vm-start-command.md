/openspec:proposal Add a oclif command to start a Proxmox VMs
Add a new oclif command to the homelab-cli that allows users to start stopped Proxmox virtual machines (VMs) by specifying their VM IDs.
If no VM ID is provided, the command should list all stopped VMs and allow the user to select one or more VMs to start interactively. use the promptForSelection utility function for this purpose.
The command should handle errors gracefully, such as when a specified VM ID does not exist, and provide informative feedback to the user.
Use the existing Proxmox API integration in the homelab-cli as a reference for how to interact with Proxmox resources.
