//src/lib/services/resourceService.ts
import axiosInstance from '../api/axiosInstance';

// --- ENUMS ---
export enum ResourceType {
  MATERIAL = "MATERIAL",
  LABOR = "LABOR",
  EQUIPMENT = "EQUIPMENT",
  CAPITAL = "CAPITAL",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// --- INTERFACES DE RETORNO (Entidades) ---
export interface Resource {
  _id: string;
  organizationId: string;
  name: string;
  type: ResourceType;
  unit: string;
  standardCost: number;
  currentStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceTransaction {
  _id: string;
  organizationId: string;
  projectId?: string;
  resourceId: string;
  authorId: string;
  type: string;
  status: TransactionStatus;
  quantity: number;
  unitCostSnapshot: number;
  totalCost: number;
  origin?: string;
  isStockNegative: boolean;
  attachments: string[];
  isCanceled: boolean;
  createdAt: string;
}

// --- INTERFACES DE ENVIO (DTOs) ---
export interface CreateResourceData {
  name: string;
  type: ResourceType;
  unit: string;
  standardCost?: number;
}

export interface AllocateResourceData {
  resourceId: string;
  quantity: number;
  origin?: string;
  attachments?: string[];
}

export interface AddStockData {
  resourceId: string;
  quantity: number;
  unitCostSnapshot?: number;
  origin?: string;
  attachments?: string[];
}

export interface ApproveRequestData {
  approvedQuantity: number;
}

export interface RejectRequestData {
  reason: string;
}

export interface CancelTransactionData {
  reason: string;
}

export const resourceService = {
  // --- EQUIPE DO ALMOXARIFADO ---
  getWarehouseTeam: async (orgId: string): Promise<string[]> => {
    const response = await axiosInstance.get(`/organizations/${orgId}/resources/team`);
    return response.data;
  },

  assignWarehouseMember: async (orgId: string, userId: string, orgRole: string): Promise<any> => {
    const response = await axiosInstance.post(
      `/organizations/${orgId}/resources/team/assign`,
      { userId },
      { headers: { 'x-org-role': orgRole } }
    );
    return response.data;
  },

  removeWarehouseMember: async (orgId: string, userId: string, orgRole: string): Promise<any> => {
    const response = await axiosInstance.post(
      `/organizations/${orgId}/resources/team/remove`,
      { userId },
      { headers: { 'x-org-role': orgRole } }
    );
    return response.data;
  },

  // --- CATÁLOGO ---
  createResource: async (orgId: string, data: CreateResourceData, orgRole?: string): Promise<Resource> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  listResources: async (orgId: string): Promise<Resource[]> => {
    const response = await axiosInstance.get(`/organizations/${orgId}/resources`);
    return response.data;
  },

  updateResource: async (orgId: string, resourceId: string, data: Partial<CreateResourceData>, orgRole?: string): Promise<Resource> => {
    const response = await axiosInstance.patch(`/organizations/${orgId}/resources/${resourceId}`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  inactivateResource: async (orgId: string, resourceId: string, orgRole?: string): Promise<Resource> => {
    const response = await axiosInstance.patch(`/organizations/${orgId}/resources/${resourceId}/inactivate`, {}, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  // --- REQUISIÇÃO PELA OBRA ---
  requestAllocation: async (orgId: string, projectId: string, data: AllocateResourceData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/request/${projectId}`, data);
    return response.data;
  },

  // --- GESTÃO DO ALMOXARIFADO (Aprovar/Rejeitar RM) ---
  approveRequest: async (orgId: string, transactionId: string, data: ApproveRequestData, orgRole?: string): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/transactions/${transactionId}/approve`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  rejectRequest: async (orgId: string, transactionId: string, data: RejectRequestData, orgRole?: string): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/transactions/${transactionId}/reject`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  // --- SAÍDA DIRETA (Almoxarifado -> Obra) ---
  allocateDirectly: async (orgId: string, projectId: string, data: AllocateResourceData, orgRole?: string): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/allocate-direct/${projectId}`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  // --- ENTRADAS E DEVOLUÇÕES DE ESTOQUE ---
  addStock: async (orgId: string, data: AddStockData, orgRole?: string): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/stock`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  returnFromProject: async (orgId: string, projectId: string, data: AllocateResourceData, orgRole?: string): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/return/${projectId}`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  // --- AUDITORIA (Estorno) ---
  cancelTransaction: async (orgId: string, transactionId: string, data: CancelTransactionData, orgRole?: string): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/transactions/${transactionId}/cancel`, data, {
      headers: orgRole ? { 'x-org-role': orgRole } : undefined
    });
    return response.data;
  },

  // --- LIVRO RAZÃO ---
  listTransactions: async (orgId: string): Promise<ResourceTransaction[]> => {
    const response = await axiosInstance.get(`/organizations/${orgId}/resources/transactions`);
    return response.data;
  },
};