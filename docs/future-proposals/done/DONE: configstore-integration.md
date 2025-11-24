# Proposal: Integrate ConfigStore npm package for Persistent Configuration Management

To enhance the user experience and streamline configuration management, we propose integrating the ConfigStore npm package into the homelab-cli project.
ConfigStore should be able to persistently store and retrieve configuration data, eliminating the need to repeatedly manage environment variables or configuration files manually.
To achieve this, the existing config implementations in `src/config` should be adapted.
By default, configuration values should be read from the ConfigStore instance. The configuration values should remain overridable via environment variables to ensure flexibility.
Create a a prove of concept with the following requirements:
- create a new config class named `CliConfig` in `src/config/cli.config.ts` that utilizes the ConfigStore package for storing configuration values.
- Create a new oclif command 'config read' that demonstrates reading configuration values from the `CliConfig` class.
- Create a new oclif command 'config write' that demonstrates writing configuration values to the `CliConfig` class and the underlying ConfigStore instance and their config file.
- Ensure that the `CliConfig` class allows for environment variable overrides for configuration values.
