import {z} from 'zod';

/**
 * Validates IP configuration format for cloud-init.
 * Accepts either "dhcp" or static IP in CIDR notation with optional gateway.
 * Examples:
 *   - "dhcp"
 *   - "ip=192.168.1.100/24"
 *   - "ip=10.0.10.123/24,gw=10.0.10.1"
 */
const ipConfigSchema = z.union([
  z.literal('dhcp'),
  z.string().regex(
    /^ip=\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}(,gw=\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/,
    'Must be "dhcp" or "ip=X.X.X.X/YY[,gw=X.X.X.X]"',
  ),
]);

/**
 * Zod schema for validating cloud-init configuration parameters.
 * Ensures all parameters meet Proxmox API requirements before submission.
 */
export const CloudInitConfigSchema = z.object({
  ipconfig0: ipConfigSchema,
  password: z.string(), // Empty string is allowed (SSH key only auth)
  sshKeys: z.string(), // Can be empty if password is set
  upgrade: z.boolean(),
  user: z.string().min(1, 'Username cannot be empty'),
});

/**
 * TypeScript type inferred from CloudInitConfigSchema.
 * Use this for type-safe cloud-init configuration objects.
 */
export type CloudInitConfig = z.infer<typeof CloudInitConfigSchema>;
