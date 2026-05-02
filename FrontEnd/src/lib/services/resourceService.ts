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
  // 1. Catálogo
  createResource: async (orgId: string, data: CreateResourceData): Promise<Resource> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources`, data);
    return response.data;
  },

  listResources: async (orgId: string): Promise<Resource[]> => {
    const response = await axiosInstance.get(`/organizations/${orgId}/resources`);
    return response.data;
  },

  // 2. Requisição pela Obra
  requestAllocation: async (orgId: string, projectId: string, data: AllocateResourceData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/request/${projectId}`, data);
    return response.data;
  },

  // 3. Gestão do Almoxarifado (Aprovar/Rejeitar RM)
  approveRequest: async (orgId: string, transactionId: string, data: ApproveRequestData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/transactions/${transactionId}/approve`, data);
    return response.data;
  },

  rejectRequest: async (orgId: string, transactionId: string, data: RejectRequestData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/transactions/${transactionId}/reject`, data);
    return response.data;
  },

  // 4. Entradas e Devoluções de Estoque
  addStock: async (orgId: string, data: AddStockData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/stock`, data);
    return response.data;
  },

  returnFromProject: async (orgId: string, projectId: string, data: AllocateResourceData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/return/${projectId}`, data);
    return response.data;
  },

  // 5. Auditoria (Estorno)
  cancelTransaction: async (orgId: string, transactionId: string, data: CancelTransactionData): Promise<ResourceTransaction> => {
    const response = await axiosInstance.post(`/organizations/${orgId}/resources/transactions/${transactionId}/cancel`, data);
    return response.data;
  },

  // 6. Livro Razão
  listTransactions: async (orgId: string): Promise<ResourceTransaction[]> => {
    const response = await axiosInstance.get(`/organizations/${orgId}/resources/transactions`);
    return response.data;
  },
};