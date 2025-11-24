## ADDED Requirements

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
