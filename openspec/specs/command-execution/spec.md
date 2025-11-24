# command-execution Specification

## Purpose
TBD - created by archiving change add-execa-command-executor. Update Purpose after archive.
## Requirements
### Requirement: Command Execution Service

The system SHALL provide a CommandExecutorService that executes shell commands using the execa library, returning results wrapped in the Result pattern for consistent error handling.

#### Scenario: Execute simple command successfully

- **GIVEN** a valid command and arguments
- **WHEN** executeCommand is called with the command and args
- **THEN** the command executes successfully
- **AND** returns Result with success=true
- **AND** result.data contains exit code, stdout, and stderr
- **AND** stdout contains the command output

#### Scenario: Execute command with non-zero exit code

- **GIVEN** a command that fails (e.g., ls on non-existent path)
- **WHEN** executeCommand is called
- **THEN** execa throws an error with exit code
- **AND** returns Result with success=false
- **AND** result.error contains the error message
- **AND** error details include exit code and stderr output

#### Scenario: Execute command not found

- **GIVEN** a command that does not exist in PATH
- **WHEN** executeCommand is called
- **THEN** execa throws ENOENT error
- **AND** returns Result with success=false
- **AND** result.error contains descriptive message about command not found

### Requirement: Working Directory Support

The system SHALL allow specifying a working directory for command execution through the options parameter.

#### Scenario: Execute command in specific directory

- **GIVEN** a command that lists files (e.g., ls or dir)
- **AND** options with cwd set to a specific path
- **WHEN** executeCommand is called with these options
- **THEN** the command executes in the specified directory
- **AND** stdout reflects files from that directory
- **AND** returns Result with success=true

#### Scenario: Execute command with invalid working directory

- **GIVEN** options with cwd set to non-existent path
- **WHEN** executeCommand is called
- **THEN** execa throws an error
- **AND** returns Result with success=false
- **AND** error message indicates invalid working directory

### Requirement: Environment Variables Support

The system SHALL allow specifying custom environment variables for command execution through the options parameter.

#### Scenario: Execute command with custom environment variable

- **GIVEN** a command that reads environment variables
- **AND** options with env containing custom variables
- **WHEN** executeCommand is called with these options
- **THEN** the command has access to custom environment variables
- **AND** command output reflects the custom values
- **AND** returns Result with success=true

#### Scenario: Execute command with merged environment

- **GIVEN** options with env containing { NODE_ENV: 'test' }
- **WHEN** executeCommand is called
- **THEN** custom env variables are merged with process.env
- **AND** command has access to both custom and system variables

### Requirement: Command Timeout Support

The system SHALL allow specifying a timeout for command execution to prevent hanging processes.

#### Scenario: Execute command within timeout

- **GIVEN** a fast command (e.g., echo)
- **AND** options with timeout of 5000ms
- **WHEN** executeCommand is called
- **THEN** command completes before timeout
- **AND** returns Result with success=true

#### Scenario: Execute command exceeding timeout

- **GIVEN** a slow command (e.g., sleep 10)
- **AND** options with timeout of 1000ms
- **WHEN** executeCommand is called
- **THEN** execa terminates the command after 1000ms
- **AND** returns Result with success=false
- **AND** error indicates timeout was exceeded

### Requirement: Real-time Output Streaming

The system SHALL stream command output in real-time using event-based listeners for both stdout and stderr.

#### Scenario: Stream stdout during long-running command

- **GIVEN** a command that produces output over time
- **WHEN** executeCommand is called
- **THEN** stdout events are emitted as data arrives
- **AND** output is displayed to terminal in real-time
- **AND** command execution waits for completion
- **AND** returns Result with full stdout captured

#### Scenario: Stream stderr during command execution

- **GIVEN** a command that writes to stderr
- **WHEN** executeCommand is called
- **THEN** stderr events are emitted as data arrives
- **AND** error output is displayed to terminal in real-time
- **AND** returns Result with full stderr captured

#### Scenario: Stream both stdout and stderr

- **GIVEN** a command that writes to both stdout and stderr
- **WHEN** executeCommand is called
- **THEN** both stdout and stderr events are handled
- **AND** output streams are interleaved correctly
- **AND** returns Result with both outputs captured separately

### Requirement: Command API Signature

The system SHALL accept commands as separate command and arguments parameters following execa's preferred API pattern.

#### Scenario: Execute command with string arguments array

- **GIVEN** command 'git' and args ['status', '--short']
- **WHEN** executeCommand('git', ['status', '--short']) is called
- **THEN** executes 'git status --short' correctly
- **AND** returns Result with success=true

#### Scenario: Execute command with no arguments

- **GIVEN** command 'pwd' and empty args array
- **WHEN** executeCommand('pwd', []) is called
- **THEN** executes command without arguments
- **AND** returns Result with success=true

#### Scenario: Execute command with arguments containing spaces

- **GIVEN** command 'git' and args ['commit', '-m', 'message with spaces']
- **WHEN** executeCommand is called
- **THEN** execa handles argument escaping correctly
- **AND** commit message includes spaces
- **AND** returns Result with success=true

### Requirement: Result Type Integration

The system SHALL return all execution results wrapped in the Result<T, E> type for consistent error handling across the application.

#### Scenario: Return success result with execution data

- **GIVEN** a successful command execution
- **WHEN** command completes
- **THEN** returns { success: true, data: ExecutionResult }
- **AND** data.exitCode is 0
- **AND** data.stdout contains output
- **AND** data.stderr is empty or contains warnings

#### Scenario: Return failure result with error

- **GIVEN** a failed command execution
- **WHEN** command exits with non-zero code
- **THEN** returns { success: false, error: Error }
- **AND** error.message describes the failure
- **AND** error contains context (command, exit code, stderr)

#### Scenario: Return failure result for exceptions

- **GIVEN** an exception during execution (e.g., ENOENT)
- **WHEN** execa throws
- **THEN** catches exception and wraps in Result
- **AND** returns { success: false, error: Error }
- **AND** error.message is descriptive and user-friendly

### Requirement: JSON Output Mode

Commands SHALL support a `--json` flag that outputs structured data in JSON format instead of human-readable tables, enabling programmatic consumption and integration with automation tools.

#### Scenario: List command with JSON flag returns structured data

- **GIVEN** a command that lists resources (e.g., `proxmox vm list`)
- **WHEN** executed with the `--json` flag
- **THEN** the command returns valid JSON to stdout
- **AND** the JSON contains an array of resource objects
- **AND** each object includes all relevant fields (vmid, name, status, ipv4Address, etc.)
- **AND** no table formatting is present in the output

#### Scenario: List command without JSON flag returns table

- **GIVEN** a command that lists resources
- **WHEN** executed without the `--json` flag
- **THEN** the command outputs a formatted table using cli-table3
- **AND** the table includes headers and aligned columns
- **AND** the output is human-readable

#### Scenario: Empty result set with JSON flag

- **GIVEN** a command that returns no results
- **WHEN** executed with the `--json` flag
- **THEN** the command returns an empty JSON array `[]`
- **AND** no error is raised

#### Scenario: Empty result set without JSON flag

- **GIVEN** a command that returns no results
- **WHEN** executed without the `--json` flag
- **THEN** the command outputs a message "No [resources] found"
- **AND** exits successfully

#### Scenario: Command error with JSON flag

- **GIVEN** a command that encounters an error
- **WHEN** executed with the `--json` flag
- **THEN** oclif's error handling serializes the error as JSON
- **AND** the error includes message and code fields
- **AND** exits with non-zero status

### Requirement: JSON Flag Implementation Pattern

Commands SHALL detect JSON mode by checking `this.jsonEnabled()` and return data objects instead of calling `this.log()` when JSON output is requested.

#### Scenario: Command detects JSON mode correctly

- **GIVEN** a command extending BaseCommand with `enableJsonFlag = true`
- **WHEN** the command's `run()` method executes
- **AND** the user provided the `--json` flag
- **THEN** `this.jsonEnabled()` returns true
- **AND** the command skips table creation logic
- **AND** the command returns the data object directly

#### Scenario: Command uses this.log for table output

- **GIVEN** a command in non-JSON mode
- **WHEN** outputting results
- **THEN** the command uses `this.log(table.toString())`
- **AND** oclif renders the output to stdout
- **AND** the command returns void or undefined

#### Scenario: Command returns structured data in JSON mode

- **GIVEN** a command in JSON mode
- **WHEN** the run() method completes
- **THEN** the command returns an array or object
- **AND** oclif automatically serializes it to JSON
- **AND** all `this.log()` calls are suppressed by oclif

### Requirement: JSON Output Validation

JSON output SHALL be valid, parseable JSON that can be piped to tools like `jq` or parsed by scripts.

#### Scenario: JSON output is valid and parseable

- **GIVEN** a command executed with `--json`
- **WHEN** the output is piped to `jq`
- **THEN** jq successfully parses the JSON
- **AND** no syntax errors occur

#### Scenario: JSON output matches schema expectations

- **GIVEN** a command that lists VMs with `--json`
- **WHEN** examining the JSON structure
- **THEN** each object matches the DTO structure
- **AND** field names use camelCase (e.g., `ipv4Address` not `ipv4_address`)
- **AND** null values are explicitly represented as `null`
- **AND** missing optional fields are either `null` or omitted

### Requirement: Documentation of JSON Output

Commands SHALL document their JSON output format in examples to help users understand the structure.

#### Scenario: Command help shows JSON example

- **GIVEN** a command with JSON support
- **WHEN** running `homelab [command] --help`
- **THEN** the examples section includes a `--json` example
- **AND** the example shows sample JSON output
- **AND** the output format is clearly documented
