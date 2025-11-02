# Implementation Tasks

## 1. Model Layer
- [ ] 1.1 Create `src/models/schemas/module-fs.schema.ts` with ModuleFsSchema (name, gitRepoUrl)
- [ ] 1.2 Create `src/models/module-fs.dto.ts` with type inference from schema
- [ ] 1.3 Write tests for ModuleFsSchema in `test/models/schemas/module-fs.schema.test.ts`

## 2. Repository Layer
- [ ] 2.1 Create `src/repositories/interfaces/module-fs.repository.interface.ts` with IModuleFsRepository
- [ ] 2.2 Implement `src/repositories/module-fs.repository.ts` with ModuleFsRepository class
  - [ ] 2.2.1 Implement findByProjectName(projectName: string) method
  - [ ] 2.2.2 Implement private isGitRepository(dirPath: string) helper
  - [ ] 2.2.3 Implement private getGitRemoteUrl(dirPath: string) helper
  - [ ] 2.2.4 Implement private createModuleDto(dirPath: string, name: string) helper
- [ ] 2.3 Write tests for ModuleFsRepository in `test/repositories/module-fs.repository.test.ts`
  - [ ] 2.3.1 Test successful module listing
  - [ ] 2.3.2 Test project src directory not found
  - [ ] 2.3.3 Test empty module list
  - [ ] 2.3.4 Test git repository detection
  - [ ] 2.3.5 Test git remote URL retrieval

## 3. Service Layer
- [ ] 3.1 Create `src/services/module-fs.service.ts` with ModuleFsService class
  - [ ] 3.1.1 Implement constructor with IModuleFsRepository dependency
  - [ ] 3.1.2 Implement listModules(projectName: string) method
  - [ ] 3.1.3 Add Zod validation for repository data
- [ ] 3.2 Write tests for ModuleFsService in `test/services/module-fs.service.test.ts`
  - [ ] 3.2.1 Test successful module listing
  - [ ] 3.2.2 Test repository error propagation
  - [ ] 3.2.3 Test validation error handling

## 4. Factory Layer
- [ ] 4.1 Create `src/factories/module.factory.ts` (or extend existing ProjectFactory)
  - [ ] 4.1.1 Implement createModuleFsService() method
  - [ ] 4.1.2 Wire ModuleFsRepository with ProjectsDirConfig
  - [ ] 4.1.3 Handle configuration errors

## 5. Utility Layer
- [ ] 5.1 Create `src/utils/detect-current-project.ts` utility
  - [ ] 5.1.1 Implement detectCurrentProject(cwd: string, projectsDir: string) function
  - [ ] 5.1.2 Handle path traversal logic
  - [ ] 5.1.3 Handle edge cases (outside projects dir, at projects root)
- [ ] 5.2 Write tests for detectCurrentProject in `test/utils/detect-current-project.test.ts`
  - [ ] 5.2.1 Test detection from module directory
  - [ ] 5.2.2 Test detection from nested subdirectory
  - [ ] 5.2.3 Test detection failure outside projects structure
  - [ ] 5.2.4 Test detection at projects root

## 6. Command Layer
- [ ] 6.1 Create `src/commands/project/module/list.ts` command
  - [ ] 6.1.1 Define command metadata (description, examples, args)
  - [ ] 6.1.2 Implement argument parsing (optional project-name)
  - [ ] 6.1.3 Implement current project detection when no arg provided
  - [ ] 6.1.4 Obtain service from ModuleFactory
  - [ ] 6.1.5 Call service.listModules() and handle Result
  - [ ] 6.1.6 Format output using cli-table3
  - [ ] 6.1.7 Handle empty results and errors
- [ ] 6.2 Write tests for module list command in `test/commands/project/module/list.test.ts`
  - [ ] 6.2.1 Test listing with explicit project name
  - [ ] 6.2.2 Test listing with current project detection
  - [ ] 6.2.3 Test empty module list handling
  - [ ] 6.2.4 Test error handling
  - [ ] 6.2.5 Test table output format

## 7. Integration and Quality
- [ ] 7.1 Build project: `pnpm run build`
- [ ] 7.2 Run all tests: `pnpm test`
- [ ] 7.3 Verify linting passes: `pnpm run lint`
- [ ] 7.4 Test command manually with real project
  - [ ] 7.4.1 Test with explicit project name: `./bin/dev.js project module list sflab`
  - [ ] 7.4.2 Test with current project detection: `cd ~/projects/sflab/src && ./path/to/bin/dev.js project module list`
  - [ ] 7.4.3 Test error cases (non-existent project, outside projects dir)

## 8. Documentation
- [ ] 8.1 Update README via oclif: `pnpm run prepack`
- [ ] 8.2 Verify command appears in README with examples
- [ ] 8.3 Verify all tests pass after README update
