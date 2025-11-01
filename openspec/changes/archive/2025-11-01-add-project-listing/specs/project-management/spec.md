# Project Management

This specification defines project management capabilities for homelab-cli.

## ADDED Requirements

### Requirement: Project Domain Model

The system SHALL define a project as an entity with the following attributes: id (string), name (string), description (string), gitRepoUrl (string), createdAt (Date), and updatedAt (Date). Projects belong to a single workspace through a relation field.

#### Scenario: Project model structure

- **GIVEN** a project entity
- **THEN** it SHALL have id, name, description, gitRepoUrl, createdAt, and updatedAt fields
- **AND** the model SHALL be validated using Zod schema
- **AND** the DTO type SHALL be inferred from the Zod schema

### Requirement: PocketBase Project Repository

The system SHALL implement a repository that fetches projects from a PocketBase `projects` collection using the PocketBase SDK. The repository SHALL filter projects by workspace using the `workspace` relation field.

#### Scenario: Fetch projects for a specific workspace

- **GIVEN** a workspace name
- **WHEN** repository.findByWorkspaceName(name) is called
- **THEN** it SHALL authenticate with PocketBase if credentials are provided
- **AND** it SHALL fetch the workspace by name with the `projects` relation expanded
- **AND** it SHALL return projects associated with that workspace
- **AND** it SHALL map PocketBase records to ProjectDTO using the Zod schema
- **AND** it SHALL return a success Result with ProjectDTO array

#### Scenario: Handle workspace not found

- **GIVEN** a non-existent workspace name
- **WHEN** repository.findByWorkspaceName(name) is called
- **THEN** it SHALL return a failure Result with RepositoryError
- **AND** the error message SHALL indicate workspace not found

#### Scenario: Handle PocketBase connection errors

- **GIVEN** PocketBase is unreachable
- **WHEN** repository.findByWorkspaceName(name) is called
- **THEN** it SHALL return a failure Result with RepositoryError
- **AND** the error SHALL include context about the connection failure

#### Scenario: Handle authentication errors

- **GIVEN** invalid PocketBase credentials
- **WHEN** repository.findByWorkspaceName(name) is called with authentication
- **THEN** it SHALL return a failure Result with RepositoryError
- **AND** the error message SHALL indicate authentication failure

#### Scenario: Handle empty project list

- **GIVEN** a workspace with no projects
- **WHEN** repository.findByWorkspaceName(name) is called
- **THEN** it SHALL return a success Result with an empty array

#### Scenario: Map PocketBase records to domain model

- **GIVEN** PocketBase project records with workspace expansion
- **WHEN** mapping to ProjectDTO
- **THEN** it SHALL map `record.id` to `id`
- **AND** it SHALL map `record.name` to `name`
- **AND** it SHALL map `record.description` to `description`
- **AND** it SHALL map `record.gitRepoUrl` to `gitRepoUrl`
- **AND** it SHALL map `record.created` to `createdAt` as Date object
- **AND** it SHALL map `record.updated` to `updatedAt` as Date object
- **AND** it SHALL validate the mapped data using ProjectSchema

### Requirement: Project Listing Service

The system SHALL provide a service that orchestrates project listing by workspace name. The service SHALL delegate data access to the repository and return Results.

#### Scenario: List projects successfully

- **GIVEN** a valid workspace name
- **WHEN** service.listProjects(workspaceName) is called
- **THEN** it SHALL call repository.findByWorkspaceName(workspaceName)
- **AND** it SHALL return the repository Result unchanged
- **AND** on success, the Result SHALL contain an array of ProjectDTO

#### Scenario: Handle repository errors

- **GIVEN** the repository returns a failure Result
- **WHEN** service.listProjects(workspaceName) is called
- **THEN** it SHALL propagate the failure Result to the caller

### Requirement: Project List Command

The system SHALL provide a `homelab project list` command that displays projects in a tabular format. The command SHALL support an optional workspace name argument. Without an argument, it SHALL determine the current workspace from the current working directory basename.

#### Scenario: List projects for explicit workspace

- **GIVEN** command `homelab project list sflab`
- **WHEN** the command executes
- **THEN** it SHALL call service.listProjects("sflab")
- **AND** it SHALL display projects in a table with columns: Name, Description, Git Repo URL
- **AND** it SHALL exit with status 0 on success

#### Scenario: List projects for current workspace

- **GIVEN** command `homelab project list` executed in directory `/home/user/projects/sflab`
- **WHEN** the command executes
- **THEN** it SHALL extract workspace name "sflab" from current directory basename
- **AND** it SHALL call service.listProjects("sflab")
- **AND** it SHALL display projects in a table with columns: Name, Description, Git Repo URL
- **AND** it SHALL exit with status 0 on success

#### Scenario: Handle empty project list

- **GIVEN** a workspace with no projects
- **WHEN** the list command executes
- **THEN** it SHALL display message "No projects found for workspace '<workspace-name>'"
- **AND** it SHALL exit with status 0

#### Scenario: Handle service errors

- **GIVEN** the service returns a failure Result
- **WHEN** the list command executes
- **THEN** it SHALL display the error message using this.error()
- **AND** it SHALL exit with status 1

#### Scenario: Handle workspace not found

- **GIVEN** a non-existent workspace name
- **WHEN** the list command executes
- **THEN** it SHALL display error "Workspace '<name>' not found"
- **AND** it SHALL exit with status 1

#### Scenario: Handle PocketBase configuration errors

- **GIVEN** missing POCKETBASE_URL environment variable
- **WHEN** the list command executes
- **THEN** it SHALL display error about missing configuration
- **AND** it SHALL exit with status 1

#### Scenario: Display tabular output

- **GIVEN** multiple projects for a workspace
- **WHEN** the list command executes successfully
- **THEN** it SHALL use cli-table3 to format output
- **AND** the table SHALL have headers: NAME, DESCRIPTION, GIT REPO URL
- **AND** each row SHALL display project name, description, and gitRepoUrl

### Requirement: Layered Architecture Implementation

The project listing feature SHALL follow the established layered architecture pattern with Command, Service, Repository, Model, and Factory layers.

#### Scenario: Command layer handles user interaction

- **GIVEN** the project list command
- **THEN** it SHALL parse arguments and flags using oclif
- **AND** it SHALL obtain service instance from ProjectFactory
- **AND** it SHALL handle Result types and convert to oclif errors
- **AND** it SHALL format output using cli-table3

#### Scenario: Service layer contains business logic

- **GIVEN** ProjectService
- **THEN** it SHALL accept IProjectRepository via constructor injection
- **AND** it SHALL return Result types for all operations
- **AND** it SHALL delegate data access to the repository

#### Scenario: Repository layer manages PocketBase access

- **GIVEN** ProjectRepository
- **THEN** it SHALL implement IProjectRepository interface
- **AND** it SHALL use PocketBase SDK for data access
- **AND** it SHALL return Result types for all operations
- **AND** it SHALL validate data using Zod schemas

#### Scenario: Model layer defines data structure

- **GIVEN** project domain model
- **THEN** it SHALL have ProjectSchema as Zod schema in src/models/schemas/
- **AND** it SHALL export ProjectDTO as inferred type from schema
- **AND** it SHALL serve as single source of truth for project structure

#### Scenario: Factory pattern for dependency injection

- **GIVEN** ProjectFactory
- **THEN** it SHALL provide createProjectService() method
- **AND** it SHALL load PocketBase configuration
- **AND** it SHALL instantiate ProjectRepository with config
- **AND** it SHALL instantiate ProjectService with repository
- **AND** it SHALL handle configuration errors and throw descriptive messages

### Requirement: Result Pattern Error Handling

The project listing feature SHALL use the Result pattern for explicit error handling throughout all layers.

#### Scenario: Repository returns success Result

- **GIVEN** successful data fetch from PocketBase
- **WHEN** repository operation completes
- **THEN** it SHALL return `{success: true, data: ProjectDTO[]}`

#### Scenario: Repository returns failure Result

- **GIVEN** any error during repository operation
- **WHEN** the error occurs
- **THEN** it SHALL return `{success: false, error: RepositoryError}`
- **AND** the error SHALL include descriptive message and context

#### Scenario: Service propagates Results

- **GIVEN** any repository Result
- **WHEN** service receives the Result
- **THEN** it SHALL propagate the Result unchanged to the caller

#### Scenario: Command handles Results

- **GIVEN** a failure Result from service
- **WHEN** command receives the Result
- **THEN** it SHALL call this.error(result.error.message, {exit: 1})

### Requirement: Comprehensive Testing

The project listing feature SHALL include comprehensive tests for all layers following the established testing patterns.

#### Scenario: Model schema tests

- **GIVEN** test/models/schemas/project.schema.test.ts
- **THEN** it SHALL test valid project data validation
- **AND** it SHALL test invalid data rejection (missing fields, wrong types)
- **AND** it SHALL test Zod schema parsing and type inference

#### Scenario: Repository unit tests

- **GIVEN** test/repositories/project.repository.test.ts
- **THEN** it SHALL test successful project fetching by workspace
- **AND** it SHALL test workspace not found error handling
- **AND** it SHALL test PocketBase connection error handling
- **AND** it SHALL test authentication error handling
- **AND** it SHALL test empty project list handling
- **AND** it SHALL test PocketBase record mapping to ProjectDTO

#### Scenario: Service unit tests

- **GIVEN** test/services/project.service.test.ts
- **THEN** it SHALL use mock repository via constructor injection
- **AND** it SHALL test successful project listing
- **AND** it SHALL test repository error propagation
- **AND** it SHALL verify service returns Result types

#### Scenario: Command integration tests

- **GIVEN** test/commands/project/list.test.ts
- **THEN** it SHALL use runCommand() from @oclif/test
- **AND** it SHALL test listing with explicit workspace name
- **AND** it SHALL test listing with current directory workspace
- **AND** it SHALL test table output formatting
- **AND** it SHALL test empty project list handling
- **AND** it SHALL test error message display

### Requirement: PocketBase Collection Schema

The project listing feature SHALL require a `projects` collection in PocketBase with specific schema and relations.

#### Scenario: Projects collection schema

- **GIVEN** PocketBase instance
- **THEN** it SHALL have a `projects` collection
- **AND** the collection SHALL have field `name` (type: text, required)
- **AND** the collection SHALL have field `description` (type: text, required)
- **AND** the collection SHALL have field `gitRepoUrl` (type: text, required)
- **AND** the collection SHALL have field `workspace` (type: relation, required, single, references: workspaces collection)
- **AND** the collection SHALL have auto-generated fields: id, created, updated

#### Scenario: Workspace relation configuration

- **GIVEN** the `workspace` field in projects collection
- **THEN** it SHALL be a single relation (not multiple)
- **AND** it SHALL reference the `workspaces` collection
- **AND** it SHALL be required (every project must belong to a workspace)
- **AND** it SHALL support expansion to retrieve workspace details

### Requirement: Documentation

The project listing feature SHALL include user documentation in the auto-generated README via oclif.

#### Scenario: README updated automatically

- **GIVEN** implementation complete
- **WHEN** `pnpm run prepack` is executed
- **THEN** the README SHALL include `homelab project list` command documentation
- **AND** it SHALL show command description, arguments, and examples
- **AND** documentation SHALL be auto-generated from command metadata

#### Scenario: Environment variables documented

- **GIVEN** the feature uses PocketBase configuration
- **THEN** the documentation SHALL reference existing PocketBase environment variables
- **AND** it SHALL note that POCKETBASE_URL is required
- **AND** it SHALL note that POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD are optional

### Requirement: Dependency Management

The project listing feature SHALL reuse existing dependencies without introducing new packages.

#### Scenario: Reuse existing dependencies

- **GIVEN** the implementation
- **THEN** it SHALL use existing `pocketbase` package for data access
- **AND** it SHALL use existing `cli-table3` for tabular output
- **AND** it SHALL use existing `zod` for validation
- **AND** it SHALL use existing `@oclif/core` for command framework
- **AND** it SHALL NOT introduce new npm dependencies
