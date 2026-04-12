// src/types/organization.ts

// Tipagens Rígidas (Single Source of Truth)
export type PlanType = 'FREE' | 'PRO' | 'ENTERPRISE';
export type RoleType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface IOrgSettings {
  logoUrl?: string;
  headerUrl?: string;
  footerUrl?: string;
}

export interface IOrganization {
  _id: string;
  name: string;
  acronym?: string;
  slug: string;
  plan: PlanType;
  status: 'active' | 'inactive' | 'suspended';
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
  settings?: IOrgSettings;
}

// O Vínculo do Usuário com a Empresa (É isso que a API retorna na listagem)
export interface IMembership {
  _id: string;
  organizationId: IOrganization; // O NestJS faz o populate deste objeto
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