import {execSync, spawnSync} from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';

import {ServiceError} from '../errors/service.error.js';
import {failure, type Result, success} from '../utils/result.js';

/**
 * Service for launching workspaces in VSCode or terminal.
 * Handles system command execution for workspace environments.
 */
export class WorkspaceLauncherService {
  /**
   * Launches VSCode with the specified workspace context file.
   * @param workspaceName - The name of the workspace
   * @param contextName - The name of the context to open
   * @returns Result indicating success or an error
   */
  async launchVSCode(
    workspaceName: string,
    contextName: string,
  ): Promise<Result<void, ServiceError>> {
    // Construct workspace file path
    const workspacePath = path.join(
      os.homedir(),
      'projects',
      workspaceName,
      `${contextName}.code-workspace`,
    );

    // Verify file exists
    if (!fs.existsSync(workspacePath)) {
      return failure(
        new ServiceError(`Workspace file not found: ${workspacePath}`, {
          context: {
            contextName,
            workspaceName,
            workspacePath,
          },
        }),
      );
    }

    try {
      // Execute VSCode with workspace file
      execSync(`code "${workspacePath}"`, {stdio: 'inherit'});
      return success(undefined as void);
    } catch (error) {
      return failure(
        new ServiceError('Failed to launch VSCode', {
          cause: error instanceof Error ? error : undefined,
          context: {
            contextName,
            message: error instanceof Error ? error.message : String(error),
            workspaceName,
            workspacePath,
          },
        }),
      );
    }
  }

  /**
   * Opens an interactive terminal at the workspace directory.
   * @param workspaceName - The name of the workspace
   * @returns Result indicating success or an error
   */
  async openTerminal(workspaceName: string): Promise<Result<void, ServiceError>> {
    // Construct workspace directory path
    const workspaceDir = path.join(os.homedir(), 'projects', workspaceName);

    // Verify directory exists
    if (!fs.existsSync(workspaceDir)) {
      return failure(
        new ServiceError(`Workspace directory not found: ${workspaceDir}`, {
          context: {
            workspaceDir,
            workspaceName,
          },
        }),
      );
    }

    try {
      // Get shell from environment or use default
      const shell = process.env.SHELL || '/bin/bash';

      // Spawn interactive shell at workspace directory
      spawnSync(shell, [], {
        cwd: workspaceDir,
        stdio: 'inherit',
      });

      return success(undefined as void);
    } catch (error) {
      return failure(
        new ServiceError('Failed to open terminal', {
          cause: error instanceof Error ? error : undefined,
          context: {
            message: error instanceof Error ? error.message : String(error),
            workspaceDir,
            workspaceName,
          },
        }),
      );
    }
  }
}
