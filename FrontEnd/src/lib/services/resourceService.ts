//src/lib/services/resourceService.ts
const BASE_URL = '/api';

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `Erro ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }
  return data;
}

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

export interface ProjectStatementCategory {
  type: ResourceType;
  total: number;
  percentage: number;
}

export interface ProjectStatementItem {
  resourceId: string;
  name: string;
  unit: string;
  type: ResourceType;
  quantity: number;
  total: number;
}

export interface ProjectStatement {
  totalAccumulated: number;
  categories: ProjectStatementCategory[];
  items: ProjectStatementItem[];
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
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/team`);
    return handleResponse(res);
  },

  assignWarehouseMember: async (orgId: string, userId: string, orgRole: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/team/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-role': orgRole },
      body: JSON.stringify({ userId, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  removeWarehouseMember: async (orgId: string, userId: string, orgRole: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/team/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-role': orgRole },
      body: JSON.stringify({ userId, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  // --- CATÁLOGO ---
  createResource: async (orgId: string, data: CreateResourceData, orgRole?: string): Promise<Resource> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  listResources: async (orgId: string): Promise<Resource[]> => {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources`);
    return handleResponse(res);
  },

  updateResource: async (orgId: string, resourceId: string, data: Partial<CreateResourceData>, orgRole?: string): Promise<Resource> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/${resourceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  inactivateResource: async (orgId: string, resourceId: string, orgRole?: string): Promise<Resource> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/${resourceId}/inactivate`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({}),
    });
    return handleResponse(res);
  },

  // --- REQUISIÇÃO PELA OBRA ---
  requestAllocation: async (orgId: string, projectId: string, data: AllocateResourceData): Promise<ResourceTransaction> => {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/request/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // --- GESTÃO DO ALMOXARIFADO (Aprovar/Rejeitar RM) ---
  approveRequest: async (orgId: string, transactionId: string, data: ApproveRequestData, orgRole?: string): Promise<ResourceTransaction> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/transactions/${transactionId}/approve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  rejectRequest: async (orgId: string, transactionId: string, data: RejectRequestData, orgRole?: string): Promise<ResourceTransaction> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/transactions/${transactionId}/reject`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  // --- SAÍDA DIRETA (Almoxarifado -> Obra) ---
  allocateDirectly: async (orgId: string, projectId: string, data: AllocateResourceData, orgRole?: string): Promise<ResourceTransaction> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/allocate-direct/${projectId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  // --- ENTRADAS E DEVOLUÇÕES DE ESTOQUE ---
  addStock: async (orgId: string, data: AddStockData, orgRole?: string): Promise<ResourceTransaction> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/stock`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  returnFromProject: async (orgId: string, projectId: string, data: AllocateResourceData, orgRole?: string): Promise<ResourceTransaction> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/return/${projectId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  // --- AUDITORIA (Estorno) ---
  cancelTransaction: async (orgId: string, transactionId: string, data: CancelTransactionData, orgRole?: string): Promise<ResourceTransaction> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (orgRole) headers['x-org-role'] = orgRole;
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/transactions/${transactionId}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, _orgRole: orgRole }),
    });
    return handleResponse(res);
  },

  // --- LIVRO RAZÃO & FINANCEIRO ---
  listTransactions: async (orgId: string): Promise<ResourceTransaction[]> => {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/transactions`);
    return handleResponse(res);
  },

  getProjectStatement: async (orgId: string, projectId: string): Promise<ProjectStatement> => {
    const res = await fetch(`${BASE_URL}/organizations/${orgId}/resources/statement/${projectId}`);
    return handleResponse(res);
  },
};
