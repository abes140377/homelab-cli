# debug-logging-capability Specification

## Purpose
Provide comprehensive debug logging capabilities for repository layer errors to aid in troubleshooting Proxmox API interactions, filesystem operations, and other data access issues.

## ADDED Requirements

### Requirement: Debug Logger Utility

The system SHALL provide a debug logger utility that conditionally outputs detailed error information based on the configured log level.

#### Scenario: Log detailed error when debug level is active

- **GIVEN** the log level is set to 'debug'
- **AND** a repository method catches an error
- **WHEN** the debug logger is called with error details
- **THEN** the console outputs the error message
- **AND** outputs the full error stack trace
- **AND** outputs the error cause chain (if present)
- **AND** outputs the context object as formatted JSON
- **AND** includes visual separators for readability

#### Scenario: Suppress debug output at info level

- **GIVEN** the log level is set to 'info'
- **AND** a repository method catches an error
- **WHEN** the debug logger is called with error details
- **THEN** no debug output is written to the console
- **AND** normal error handling proceeds

#### Scenario: Suppress debug output at warn level

- **GIVEN** the log level is set to 'warn'
- **AND** a repository method catches an error
- **WHEN** the debug logger is called with error details
- **THEN** no debug output is written to the console

#### Scenario: Log detailed error when trace level is active

- **GIVEN** the log level is set to 'trace'
- **AND** a repository method catches an error
- **WHEN** the debug logger is called with error details
- **THEN** the console outputs full error details including stack traces

#### Scenario: Handle non-Error objects gracefully

- **GIVEN** the log level is set to 'debug'
- **AND** a repository catches a thrown string or object (not Error instance)
- **WHEN** the debug logger is called with the non-Error value
- **THEN** the value is logged as a string representation
- **AND** no attempt is made to access Error-specific properties

#### Scenario: Format context object for readability

- **GIVEN** the log level is set to 'debug'
- **AND** a context object with multiple fields is provided
- **WHEN** the debug logger outputs the context
- **THEN** the context is formatted as JSON with 2-space indentation
- **AND** nested objects are properly formatted

### Requirement: Log Level Access

The debug logger SHALL determine the current log level by reading from the CLI configuration or environment variable.

#### Scenario: Read log level from environment variable

- **GIVEN** the environment variable HOMELAB_LOG_LEVEL is set to 'debug'
- **WHEN** the debug logger checks the log level
- **THEN** it returns 'debug'
- **AND** enables debug output

#### Scenario: Read log level from CLI config

- **GIVEN** no HOMELAB_LOG_LEVEL environment variable is set
- **AND** the CLI config has logLevel set to 'debug'
- **WHEN** the debug logger checks the log level
- **THEN** it reads from CLI config
- **AND** returns 'debug'

#### Scenario: Default to info level when not configured

- **GIVEN** no HOMELAB_LOG_LEVEL environment variable is set
- **AND** the CLI config is not accessible or not configured
- **WHEN** the debug logger checks the log level
- **THEN** it defaults to 'info'
- **AND** suppresses debug output

#### Scenario: Environment variable overrides CLI config

- **GIVEN** HOMELAB_LOG_LEVEL environment variable is set to 'debug'
- **AND** CLI config has logLevel set to 'info'
- **WHEN** the debug logger checks the log level
- **THEN** the environment variable takes precedence
- **AND** returns 'debug'

### Requirement: ProxmoxApiRepository Debug Logging

All ProxmoxApiRepository methods SHALL log detailed error information when debug log level is active.

#### Scenario: Log Proxmox API connection error with stack trace

- **GIVEN** the log level is set to 'debug'
- **AND** the Proxmox API connection fails with ECONNREFUSED
- **WHEN** listTemplates() catches the connection error
- **THEN** debug output shows the error message "connect ECONNREFUSED"
- **AND** shows the full stack trace
- **AND** shows the context including host and port
- **AND** excludes tokenSecret from the context

#### Scenario: Log VM clone error with parameters

- **GIVEN** the log level is set to 'debug'
- **AND** cloneFromTemplate() fails during API call
- **WHEN** the error is caught
- **THEN** debug output includes the error details
- **AND** includes context with node, templateVmid, newVmid, and vmName
- **AND** excludes tokenSecret from the context

#### Scenario: Log task timeout with context

- **GIVEN** the log level is set to 'debug'
- **AND** waitForTask() exceeds the timeout duration
- **WHEN** the timeout error is caught
- **THEN** debug output includes timeout duration
- **AND** includes node and upid in context
- **AND** shows the full error stack trace

#### Scenario: Log resource listing error

- **GIVEN** the log level is set to 'debug'
- **AND** listResources() receives an unexpected API response format
- **WHEN** the validation error is caught
- **THEN** debug output shows the error details
- **AND** includes the resourceType in context

#### Scenario: Log VM config error with all parameters

- **GIVEN** the log level is set to 'debug'
- **AND** setVMConfig() fails during API call
- **WHEN** the error is caught
- **THEN** debug output includes node, vmid, and config parameters
- **AND** shows the full error chain
- **AND** excludes any sensitive configuration values

#### Scenario: Log VMID allocation error

- **GIVEN** the log level is set to 'debug'
- **AND** getNextAvailableVmid() fails to fetch cluster resources
- **WHEN** the error is caught
- **THEN** debug output includes the full error details
- **AND** shows the error cause chain

### Requirement: ProjectFsRepository Debug Logging

All ProjectFsRepository methods SHALL log detailed error information when debug log level is active.

#### Scenario: Log project not found error with path

- **GIVEN** the log level is set to 'debug'
- **AND** findByName() is called with a non-existent project name
- **WHEN** the ENOENT error is caught
- **THEN** debug output shows the error code ENOENT
- **AND** includes the project name and full path in context
- **AND** shows the stack trace

#### Scenario: Log filesystem permission error

- **GIVEN** the log level is set to 'debug'
- **AND** findAll() encounters a permission denied error
- **WHEN** the EACCES error is caught
- **THEN** debug output shows the permission error details
- **AND** includes the projectsDir path in context

#### Scenario: Log Git repository validation error

- **GIVEN** the log level is set to 'debug'
- **AND** findByName() finds a directory that is not a Git repository
- **WHEN** the validation error is returned
- **THEN** debug output shows the validation failure
- **AND** includes the directory path in context

#### Scenario: Log Git remote URL fetch error

- **GIVEN** the log level is set to 'debug'
- **AND** createProjectDto() fails to get the Git remote URL
- **WHEN** the error is caught
- **THEN** debug output shows the Git command error
- **AND** includes the directory path and project name in context

### Requirement: ModuleFsRepository Debug Logging

All ModuleFsRepository methods SHALL log detailed error information when debug log level is active.

#### Scenario: Log module directory not found error

- **GIVEN** the log level is set to 'debug'
- **AND** findByProjectName() is called with a project that has no src directory
- **WHEN** the ENOENT error is caught
- **THEN** debug output shows the directory not found error
- **AND** includes projectName and projectSrcDir path in context
- **AND** shows the stack trace

#### Scenario: Log module DTO creation error

- **GIVEN** the log level is set to 'debug'
- **AND** createModuleDto() fails Zod validation
- **WHEN** the validation error is caught
- **THEN** debug output shows the Zod validation details
- **AND** includes the module name and directory path in context

#### Scenario: Log module Git command error

- **GIVEN** the log level is set to 'debug'
- **AND** getGitRemoteUrl() fails for a module
- **WHEN** the command execution error occurs
- **THEN** debug output shows the Git command failure
- **AND** includes the module directory path in context

### Requirement: Sensitive Data Exclusion

Debug logging SHALL exclude sensitive information from output to prevent security issues.

#### Scenario: Exclude API tokens from debug output

- **GIVEN** the log level is set to 'debug'
- **AND** a Proxmox repository method fails
- **WHEN** debug logging outputs the error context
- **THEN** the tokenSecret field is NOT included in the output
- **AND** the tokenKey field is NOT included in the output
- **AND** the host and port ARE included

#### Scenario: Exclude passwords from debug output

- **GIVEN** the log level is set to 'debug'
- **AND** an error context contains a password field
- **WHEN** debug logging outputs the error context
- **THEN** the password field is NOT included in the output

#### Scenario: Include non-sensitive configuration

- **GIVEN** the log level is set to 'debug'
- **AND** an error context contains host, port, user, and realm
- **WHEN** debug logging outputs the error context
- **THEN** all non-sensitive fields are included
- **AND** provide useful diagnostic information

## Related Capabilities
- `persistent-config-management`: Provides the CLI config for log level settings
- `command-execution`: Uses similar error handling patterns in CommandExecutorService

## Cross-cutting Concerns
- **Security**: Must never log sensitive data (tokens, passwords, keys)
- **Performance**: Debug logging should only activate when needed (log level check)
- **Consistency**: All repository methods should use the same debug logging pattern
