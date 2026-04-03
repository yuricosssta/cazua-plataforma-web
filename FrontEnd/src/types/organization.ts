//src/types/organization.ts
// Tipagens Rígidas (Single Source of Truth)
export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';
export type RoleType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface IOrganization {
  _id: string;
  name: string;
  acronym: string;
  slug: string;
  plan: PlanType;
  status: 'active' | 'inactive' | 'suspended';
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMembership {
  _id: string;
  organizationId: IOrganization;
  userId: string;
  role: RoleType;
  createdAt?: string;
}

// Utilitários para a UI
export const RoleLabels: Record<RoleType, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador'
};

export const PlanLabels: Record<PlanType, string> = {
  FREE: 'Plano Gratuito',
  PRO: 'Plano PRO',
  ENTERPRISE: 'Plano Enterprise'
};