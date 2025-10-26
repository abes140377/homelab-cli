# Proposal: Integrate ConfigStore npm package for Persistent Configuration Management

To enhance the user experience and streamline configuration management, we propose integrating the ConfigStore npm package into the homelab-cli project.
ConfigStore should be able to persistently store and retrieve configuration data, eliminating the need to repeatedly manage environment variables or configuration files manually.
To achieve this, the existing implementation in src/config/proxmox.config.ts must be adapted.

By default, the required configuration values should be read from the ConfigStore instance.
The configuration should remain overridable via environment variables to ensure flexibility.
