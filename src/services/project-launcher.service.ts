import {execSync, spawnSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';

import {ServiceError} from '../errors/service.error.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for launching projects in VSCode or terminal.
 * Handles system command execution for project environments.
 */
export class ProjectLauncherService {
  /**
   * Launches VSCode with the specified project context file.
   * @param projectName - The name of the project
   * @param contextName - The name of the context to open
   * @returns Result indicating success or an error
   */
  async launchVSCode(
    projectName: string,
    contextName: string,
  ): Promise<Result<void, ServiceError>> {
    // Construct project file path
    const projectPath = path.join(
      os.homedir(),
      'projects',
      projectName,
      `${contextName}.code-workspace`,
    );

    // Verify file exists
    if (!fs.existsSync(projectPath)) {
      return failure(
        new ServiceError(`Project file not found: ${projectPath}`, {
          context: {
            contextName,
            projectName,
            projectPath,
          },
        }),
      );
    }

    try {
      // Execute VSCode with project file
      execSync(`code "${projectPath}"`, {stdio: 'inherit'});
      return success(undefined as void);
    } catch (error) {
      return failure(
        new ServiceError('Failed to launch VSCode', {
          cause: error instanceof Error ? error : undefined,
          context: {
            contextName,
            message: error instanceof Error ? error.message : String(error),
            projectName,
            projectPath,
          },
        }),
      );
    }
  }

  /**
   * Opens an interactive terminal at the project directory.
   * @param projectName - The name of the project
   * @returns Result indicating success or an error
   */
  async openTerminal(projectName: string): Promise<Result<void, ServiceError>> {
    // Construct project directory path
    const projectDir = path.join(os.homedir(), 'projects', projectName);

    // Verify directory exists
    if (!fs.existsSync(projectDir)) {
      return failure(
        new ServiceError(`Project directory not found: ${projectDir}`, {
          context: {
            projectDir,
            projectName,
          },
        }),
      );
    }

    try {
      // Get shell from environment or use default
      const shell = process.env.SHELL || '/bin/bash';

      // Spawn interactive shell at project directory
      spawnSync(shell, [], {
        cwd: projectDir,
        stdio: 'inherit',
      });

      return success(undefined as void);
    } catch (error) {
      return failure(
        new ServiceError('Failed to open terminal', {
          cause: error instanceof Error ? error : undefined,
          context: {
            message: error instanceof Error ? error.message : String(error),
            projectDir,
            projectName,
          },
        }),
      );
    }
  }
}
