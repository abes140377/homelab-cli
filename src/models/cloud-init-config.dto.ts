/**
 * Data Transfer Object for cloud-init configuration.
 * Contains validated cloud-init parameters for Proxmox VM configuration.
 */
export class CloudInitConfigDTO {
  // eslint-disable-next-line max-params
  constructor(
    public readonly user: string,
    public readonly password: string,
    public readonly sshKeys: string,
    public readonly ipconfig0: string,
    public readonly upgrade: boolean,
  ) {}
}
