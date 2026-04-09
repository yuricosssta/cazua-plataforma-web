//src/organization/schemas/models/organization-member.interface.ts
import { IOrganization, RoleType } from "./organization.interface";

export interface IOrganizationMember {
  _id: string;
  organizationId: IOrganization;
  userId: string;
  role: RoleType;
  createdAt?: string;
  function?: string;
}