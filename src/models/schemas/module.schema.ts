import {z} from 'zod';

/**
 * Validates git repository URLs.
 * Accepts both HTTP/HTTPS URLs and SSH format (git@host:path).
 */
const gitRepoUrlValidator = z.string().min(1).refine(
  (value) => {
    // Check for HTTP/HTTPS URL format
    try {
      const url = new URL(value);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return true;
      }
    } catch {
      // Not a valid HTTP/HTTPS URL, continue to check SSH format
    }

    // Check for SSH format: git@host:path
    const sshPattern = /^git@[\w.-]+:[\w./-]+$/;
    return sshPattern.test(value);
  },
  {
    message: 'Must be a valid git repository URL (HTTP/HTTPS or SSH format like git@github.com:user/repo.git)',
  },
);

/**
 * Zod schema for module validation.
 * Serves as the single source of truth for module data structure.
 */
export const ModuleSchema = z.object({
  createdAt: z.date(),
  description: z.string().min(1),
  gitRepoUrl: gitRepoUrlValidator,
  id: z.string().min(1), // Support both PocketBase IDs (15 chars) and UUIDs
  name: z.string().min(1),
  updatedAt: z.date(),
});
