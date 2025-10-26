# Proxmox Configuration

## ADDED Requirements

### Requirement: Granular Environment Variables
The system SHALL accept Proxmox configuration through individual environment variables for each configuration component.

#### Scenario: User provides all required environment variables
- **WHEN** all six environment variables are set (`PROXMOX_USER`, `PROXMOX_REALM`, `PROXMOX_TOKEN_KEY`, `PROXMOX_TOKEN_SECRET`, `PROXMOX_HOST`, `PROXMOX_PORT`)
- **THEN** configuration loads successfully and constructs the token ID as `{user}@{realm}!{tokenKey}` for API authentication

#### Scenario: User omits optional PORT variable
- **WHEN** `PROXMOX_PORT` is not set but all other required variables are provided
- **THEN** configuration uses default port `8006` and loads successfully

#### Scenario: User provides invalid token secret format
- **WHEN** `PROXMOX_TOKEN_SECRET` is not a valid UUID format
- **THEN** configuration validation fails with clear error message indicating the expected format

### Requirement: Environment Variable Validation
The system SHALL validate each environment variable independently with specific error messages.

#### Scenario: Missing required user variable
- **WHEN** `PROXMOX_USER` environment variable is not set
- **THEN** configuration loader throws error: "PROXMOX_USER environment variable is required"

#### Scenario: Missing required realm variable
- **WHEN** `PROXMOX_REALM` environment variable is not set
- **THEN** configuration loader throws error: "PROXMOX_REALM environment variable is required"

#### Scenario: Missing required token key variable
- **WHEN** `PROXMOX_TOKEN_KEY` environment variable is not set
- **THEN** configuration loader throws error: "PROXMOX_TOKEN_KEY environment variable is required"

#### Scenario: Missing required token secret variable
- **WHEN** `PROXMOX_TOKEN_SECRET` environment variable is not set
- **THEN** configuration loader throws error: "PROXMOX_TOKEN_SECRET environment variable is required"

#### Scenario: Missing required host variable
- **WHEN** `PROXMOX_HOST` environment variable is not set
- **THEN** configuration loader throws error: "PROXMOX_HOST environment variable is required"

#### Scenario: Invalid port number
- **WHEN** `PROXMOX_PORT` is not a valid positive integer
- **THEN** configuration validation fails with error: "PROXMOX_PORT must be a positive integer"

#### Scenario: Empty required variable
- **WHEN** any required environment variable is set but empty
- **THEN** configuration validation fails with error indicating which variable must not be empty

### Requirement: Token Composition
The system SHALL compose the Proxmox API token from separate components for authentication.

#### Scenario: Standard token composition
- **WHEN** `PROXMOX_USER=root`, `PROXMOX_REALM=pam`, `PROXMOX_TOKEN_KEY=homelabcli`, `PROXMOX_TOKEN_SECRET=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce`
- **THEN** the system constructs token ID `root@pam!homelabcli` and token secret `bd2ed89e-6a09-48e8-8a6e-38da9128c8ce` for use with proxmox-api package

#### Scenario: Custom realm token composition
- **WHEN** `PROXMOX_USER=admin`, `PROXMOX_REALM=pve`, `PROXMOX_TOKEN_KEY=mytoken`, `PROXMOX_TOKEN_SECRET=12345678-1234-1234-1234-123456789abc`
- **THEN** the system constructs token ID `admin@pve!mytoken` and token secret `12345678-1234-1234-1234-123456789abc`

### Requirement: Host Configuration
The system SHALL accept hostname and port as separate configuration values.

#### Scenario: Standard host and port configuration
- **WHEN** `PROXMOX_HOST=proxmox.home.sflab.io` and `PROXMOX_PORT=8006`
- **THEN** configuration constructs full host URL `https://proxmox.home.sflab.io:8006` for API connections

#### Scenario: Custom port configuration
- **WHEN** `PROXMOX_HOST=proxmox.local` and `PROXMOX_PORT=8443`
- **THEN** configuration constructs full host URL `https://proxmox.local:8443` for API connections

#### Scenario: Default port configuration
- **WHEN** `PROXMOX_HOST=proxmox.example.com` and `PROXMOX_PORT` is not set
- **THEN** configuration constructs full host URL `https://proxmox.example.com:8006` using default port

### Requirement: Backward Compatibility Documentation
The system SHALL provide clear migration documentation for users upgrading from the old configuration format.

#### Scenario: Migration guide in .env.example
- **WHEN** developer views `.env.example` file
- **THEN** file contains comments explaining how to convert from old format (`PROXMOX_API_TOKEN=user@realm!tokenid=secret`) to new format (six separate variables)

#### Scenario: Integration test documentation
- **WHEN** developer views integration test file
- **THEN** comments explain the new environment variable format and provide examples

## REMOVED Requirements

### Requirement: Monolithic API Token
**Reason**: Replaced with granular token component variables for better usability and clarity
**Migration**: Split `PROXMOX_API_TOKEN=user@realm!tokenid=secret` into:
- `PROXMOX_USER=user`
- `PROXMOX_REALM=realm`
- `PROXMOX_TOKEN_KEY=tokenid`
- `PROXMOX_TOKEN_SECRET=secret`

### Requirement: URL-Based Host Configuration
**Reason**: Replaced with separate hostname and port variables to avoid URL parsing complexity
**Migration**: Split `PROXMOX_HOST=https://hostname:port` into:
- `PROXMOX_HOST=hostname` (without protocol or port)
- `PROXMOX_PORT=port` (defaults to 8006 if omitted)
