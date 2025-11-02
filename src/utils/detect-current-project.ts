import {normalize, sep} from 'node:path'

/**
 * Detects the current project name from a working directory path.
 *
 * The function traverses up the directory tree to find the projects directory,
 * then extracts the project name as the first directory under projects.
 *
 * @param cwd - The current working directory (absolute path)
 * @param projectsDir - The projects directory path (absolute path)
 * @returns The project name, or null if detection fails
 *
 * @example
 * // Returns "sflab"
 * detectCurrentProject('/Users/user/projects/sflab/src/homelab-cli', '/Users/user/projects')
 *
 * @example
 * // Returns "myproject"
 * detectCurrentProject('/Users/user/projects/myproject/src/some-module/deep/nested', '/Users/user/projects')
 *
 * @example
 * // Returns null (outside projects directory)
 * detectCurrentProject('/tmp/somewhere', '/Users/user/projects')
 */
export function detectCurrentProject(cwd: string, projectsDir: string): null | string {
  // Normalize paths to ensure consistent separators
  const normalizedCwd = normalize(cwd)
  const normalizedProjectsDir = normalize(projectsDir)

  // Check if current directory is under projects directory
  if (!normalizedCwd.startsWith(normalizedProjectsDir)) {
    return null
  }

  // Get the relative path from projects directory to current directory
  const relativePath = normalizedCwd.slice(normalizedProjectsDir.length)

  // Split the relative path into components
  const pathComponents = relativePath.split(sep).filter((component) => component.length > 0)

  // The first component is the project name
  if (pathComponents.length === 0) {
    // We're at the projects root, no project selected
    return null
  }

  return pathComponents[0]
}
