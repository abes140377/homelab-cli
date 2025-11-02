# project-module-listing Specification

## Purpose
TBD - created by archiving change add-project-module-listing. Update Purpose after archive.
## Requirements
### Requirement: Module Domain Model

The system SHALL define a module as an entity with the following attributes: name (string) and gitRepoUrl (string). Modules belong to a project and are represented as git repositories in the filesystem.

#### Scenario: Module model structure

- **GIVEN** a module entity
- **THEN** it SHALL have name and gitRepoUrl fields
- **AND** the model SHALL be validated using Zod schema (ModuleFsSchema)
- **AND** the DTO type SHALL be inferred from the Zod schema

### Requirement: Filesystem Module Repository

The system SHALL implement a repository that scans the filesystem for modules within a project's `src/` directory. The repository SHALL identify modules as directories containing a `.git` folder.

#### Scenario: Find modules for a project by name

- **GIVEN** a project name (e.g., "sflab")
- **WHEN** repository.findByProjectName(name) is called
- **THEN** it SHALL construct the path `~/projects/<name>/src`
- **AND** it SHALL scan the directory for subdirectories
- **AND** it SHALL filter for directories containing a `.git` folder
- **AND** it SHALL retrieve the git remote URL for each module
- **AND** it SHALL create ModuleFsDto for each valid module
- **AND** it SHALL return a success Result with ModuleFsDto array

#### Scenario: Handle project directory not found

- **GIVEN** a project name that does not exist on filesystem
- **WHEN** repository.findByProjectName(name) is called
- **THEN** it SHALL return a failure Result with RepositoryError
- **AND** the error message SHALL indicate the project src directory was not found

#### Scenario: Handle empty module list

- **GIVEN** a project with no git repositories in the src directory
- **WHEN** repository.findByProjectName(name) is called
- **THEN** it SHALL return a success Result with an empty array

#### Scenario: Handle missing src directory

- **GIVEN** a project directory without a `src/` subdirectory
- **WHEN** repository.findByProjectName(name) is called
- **THEN** it SHALL return a failure Result with RepositoryError
- **AND** the error message SHALL indicate the src directory does not exist

#### Scenario: Retrieve git remote URL for module

- **GIVEN** a module directory with git remote configured
- **WHEN** creating ModuleFsDto
- **THEN** it SHALL execute `git remote get-url origin` in the module directory
- **AND** it SHALL return the remote URL trimmed of whitespace
- **AND** if git remote fails, it SHALL return empty string

#### Scenario: Validate modules are git repositories

- **GIVEN** a directory under `~/projects/<project>/src/`
- **WHEN** checking if it is a module
- **THEN** it SHALL verify a `.git` subdirectory exists
- **AND** it SHALL verify `.git` is a directory (not a file)
- **AND** if no `.git` directory exists, it SHALL exclude the directory from results

#### Scenario: Skip hidden directories

- **GIVEN** directories starting with `.` in the src folder
- **WHEN** scanning for modules
- **THEN** it SHALL exclude hidden directories from module results

### Requirement: Module Listing Service

The system SHALL provide a service that orchestrates module listing by project name. The service SHALL delegate filesystem access to the repository and apply validation.

#### Scenario: List modules successfully

- **GIVEN** a valid project name
- **WHEN** service.listModules(projectName) is called
- **THEN** it SHALL call repository.findByProjectName(projectName)
- **AND** it SHALL validate the data using Zod schema
- **AND** on success, it SHALL return a success Result with ModuleFsDto array

#### Scenario: Handle repository errors

- **GIVEN** the repository returns a failure Result
- **WHEN** service.listModules(projectName) is called
- **THEN** it SHALL return a failure Result with ServiceError
- **AND** the error SHALL wrap the repository error as the cause

#### Scenario: Handle validation errors

- **GIVEN** repository returns data that fails Zod validation
- **WHEN** service.listModules(projectName) is called
- **THEN** it SHALL return a failure Result with ServiceError
- **AND** the error SHALL include Zod validation details

### Requirement: Project Module List Command

The system SHALL provide a `homelab project module list [project-name]` command that displays modules in a tabular format. The project-name argument is optional. When omitted, the command SHALL detect the current project from the working directory.

#### Scenario: List modules with explicit project name

- **GIVEN** command `homelab project module list sflab`
- **WHEN** the command executes
- **THEN** it SHALL call service.listModules("sflab")
- **AND** it SHALL display modules in a table with columns: NAME, GIT REPOSITORY URL
- **AND** it SHALL exit with status 0 on success

#### Scenario: List modules for current project

- **GIVEN** command `homelab project module list` executed in directory `~/projects/sflab/src/homelab-cli`
- **WHEN** the command executes
- **THEN** it SHALL traverse up the directory tree to find the projects directory
- **AND** it SHALL identify "sflab" as the current project (first directory under ~/projects/)
- **AND** it SHALL call service.listModules("sflab")
- **AND** it SHALL display modules in a table with columns: NAME, GIT REPOSITORY URL
- **AND** it SHALL exit with status 0 on success

#### Scenario: List modules from nested module directory

- **GIVEN** command `homelab project module list` executed in directory `~/projects/myproject/src/some-module/subdir`
- **WHEN** the command executes
- **THEN** it SHALL traverse up to find the projects directory
- **AND** it SHALL identify "myproject" as the current project
- **AND** it SHALL call service.listModules("myproject")
- **AND** it SHALL display modules in a table
- **AND** it SHALL exit with status 0 on success

#### Scenario: Handle empty module list

- **GIVEN** a project with no modules
- **WHEN** the list command executes
- **THEN** it SHALL display message "No modules found for project '<project-name>'"
- **AND** it SHALL exit with status 0

#### Scenario: Handle service errors

- **GIVEN** the service returns a failure Result
- **WHEN** the list command executes
- **THEN** it SHALL display the error message using this.error()
- **AND** it SHALL exit with status 1

#### Scenario: Handle project not found

- **GIVEN** a non-existent project name
- **WHEN** the list command executes
- **THEN** it SHALL display error "Failed to list modules: ..." with repository error details
- **AND** it SHALL exit with status 1

#### Scenario: Handle current project detection failure

- **GIVEN** command executed outside the projects directory structure
- **WHEN** the list command executes without project-name argument
- **THEN** it SHALL display error "Could not detect current project"
- **AND** it SHALL exit with status 1

#### Scenario: Display tabular output

- **GIVEN** multiple modules for a project
- **WHEN** the list command executes successfully
- **THEN** it SHALL use cli-table3 to format output
- **AND** the table SHALL have headers: NAME, GIT REPOSITORY URL
- **AND** each row SHALL display module name and gitRepoUrl
- **AND** modules with no remote SHALL display "(no remote)"

### Requirement: Current Project Detection Logic

The system SHALL provide logic to detect the current project from the working directory by traversing up the directory tree to find the first directory under the configured projects directory.

#### Scenario: Detect project from module directory

- **GIVEN** working directory `~/projects/sflab/src/homelab-cli`
- **AND** projects directory configured as `~/projects`
- **WHEN** detecting current project
- **THEN** it SHALL split the working directory path
- **AND** it SHALL find the projects directory in the path
- **AND** it SHALL extract the next directory component as project name ("sflab")
- **AND** it SHALL return "sflab"

#### Scenario: Detect project from nested subdirectory

- **GIVEN** working directory `~/projects/myproject/src/some-module/deep/nested`
- **AND** projects directory configured as `~/projects`
- **WHEN** detecting current project
- **THEN** it SHALL extract "myproject" as the project name

#### Scenario: Handle working directory outside projects structure

- **GIVEN** working directory `/tmp/somewhere`
- **AND** projects directory configured as `~/projects`
- **WHEN** detecting current project
- **THEN** it SHALL return null or throw error indicating detection failed

#### Scenario: Handle working directory at projects root

- **GIVEN** working directory `~/projects`
- **WHEN** detecting current project
- **THEN** it SHALL return null or throw error (no project selected)

### Requirement: Layered Architecture Implementation

The module listing feature SHALL follow the established layered architecture pattern with Command, Service, Repository, Model, and Factory layers.

#### Scenario: Command layer handles user interaction

- **GIVEN** the project module list command
- **THEN** it SHALL parse arguments (optional project-name) using oclif
- **AND** it SHALL detect current project if no argument provided
- **AND** it SHALL obtain service instance from ModuleFactory
- **AND** it SHALL handle Result types and convert to oclif errors
- **AND** it SHALL format output using cli-table3

#### Scenario: Service layer contains business logic

- **GIVEN** ModuleFsService
- **THEN** it SHALL accept IModuleFsRepository via constructor injection
- **AND** it SHALL return Result types for all operations
- **AND** it SHALL validate data using Zod schemas
- **AND** it SHALL delegate filesystem access to the repository

#### Scenario: Repository layer manages filesystem access

- **GIVEN** ModuleFsRepository
- **THEN** it SHALL implement IModuleFsRepository interface
- **AND** it SHALL use Node.js fs/promises for filesystem operations
- **AND** it SHALL use child_process exec for git commands
- **AND** it SHALL return Result types for all operations
- **AND** it SHALL validate data using Zod schemas

#### Scenario: Model layer defines data structure

- **GIVEN** module domain model
- **THEN** it SHALL have ModuleFsSchema as Zod schema in src/models/schemas/
- **AND** it SHALL export ModuleFsDto as inferred type from schema
- **AND** it SHALL serve as single source of truth for module structure

#### Scenario: Factory pattern for dependency injection

- **GIVEN** ModuleFactory (or ProjectFactory extension)
- **THEN** it SHALL provide createModuleFsService() method
- **AND** it SHALL load projects directory configuration
- **AND** it SHALL instantiate ModuleFsRepository with config
- **AND** it SHALL instantiate ModuleFsService with repository
- **AND** it SHALL handle configuration errors with descriptive messages

### Requirement: Result Pattern Error Handling

The module listing feature SHALL use the Result pattern for explicit error handling throughout all layers, consistent with the project's architecture.

#### Scenario: Repository returns success Result

- **GIVEN** successful scan of project src directory
- **WHEN** repository operation completes
- **THEN** it SHALL return `{success: true, data: ModuleFsDto[]}`

#### Scenario: Repository returns failure Result

- **GIVEN** any error during repository operation
- **WHEN** the error occurs
- **THEN** it SHALL return `{success: false, error: RepositoryError}`
- **AND** the error SHALL include descriptive message and context

#### Scenario: Service propagates Results

- **GIVEN** any repository Result
- **WHEN** service receives the Result
- **THEN** it SHALL wrap errors in ServiceError
- **AND** it SHALL propagate success Results unchanged

#### Scenario: Command handles Results

- **GIVEN** a failure Result from service
- **WHEN** command receives the Result
- **THEN** it SHALL call this.error(result.error.message, {exit: 1})

### Requirement: Comprehensive Testing

The module listing feature SHALL include comprehensive tests for all layers following the established testing patterns.

#### Scenario: Model schema tests

- **GIVEN** test/models/schemas/module-fs.schema.test.ts
- **THEN** it SHALL test valid module data validation
- **AND** it SHALL test invalid data rejection (missing fields, wrong types)
- **AND** it SHALL test Zod schema parsing and type inference

#### Scenario: Repository unit tests

- **GIVEN** test/repositories/module-fs.repository.test.ts
- **THEN** it SHALL test successful module listing by project
- **AND** it SHALL test project not found error handling
- **AND** it SHALL test src directory not found error handling
- **AND** it SHALL test empty module list handling
- **AND** it SHALL test git repository detection
- **AND** it SHALL test git remote URL retrieval

#### Scenario: Service unit tests

- **GIVEN** test/services/module-fs.service.test.ts
- **THEN** it SHALL use mock repository via constructor injection
- **AND** it SHALL test successful module listing
- **AND** it SHALL test repository error propagation
- **AND** it SHALL verify service returns Result types

#### Scenario: Command integration tests

- **GIVEN** test/commands/project/module/list.test.ts
- **THEN** it SHALL use runCommand() from @oclif/test
- **AND** it SHALL test listing with explicit project name
- **AND** it SHALL test listing with current directory project detection
- **AND** it SHALL test table output formatting
- **AND** it SHALL test empty module list handling
- **AND** it SHALL test error message display

#### Scenario: Current project detection tests

- **GIVEN** utility tests for project detection logic
- **THEN** it SHALL test detection from various directory depths
- **AND** it SHALL test detection failure outside projects directory
- **AND** it SHALL test edge cases (projects root, symlinks)

### Requirement: Documentation

The module listing feature SHALL include user documentation in the auto-generated README via oclif.

#### Scenario: README updated automatically

- **GIVEN** implementation complete
- **WHEN** `pnpm run prepack` is executed
- **THEN** the README SHALL include `homelab project module list` command documentation
- **AND** it SHALL show command description, arguments, and examples
- **AND** documentation SHALL be auto-generated from command metadata

#### Scenario: Command examples include current project usage

- **GIVEN** command examples in command metadata
- **THEN** it SHALL show example with explicit project name
- **AND** it SHALL show example without argument (current project detection)
- **AND** examples SHALL include sample output tables

### Requirement: Dependency Management

The module listing feature SHALL reuse existing dependencies without introducing new packages.

#### Scenario: Reuse existing dependencies

- **GIVEN** the implementation
- **THEN** it SHALL use existing Node.js fs/promises for filesystem operations
- **AND** it SHALL use existing child_process for git commands
- **AND** it SHALL use existing cli-table3 for tabular output
- **AND** it SHALL use existing zod for validation
- **AND** it SHALL use existing @oclif/core for command framework
- **AND** it SHALL NOT introduce new npm dependencies
