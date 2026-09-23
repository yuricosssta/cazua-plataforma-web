// src/lib/services/planningService.ts
const BASE_URL = '/api';
const NEST_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `Erro ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }
  return data;
}

// --- INTERFACES DE DTOs ---
export interface UploadPlanningPayload {
  isGlobal: boolean;
  organizationId?: string;
  state: string;
  referenceMonth: number;
  referenceYear: number;
  grupo: string;
}

export interface SearchPlanningQuery {
  q?: string;
  isGlobal?: boolean;
  state?: string;
  referenceMonth?: number;
  referenceYear?: number;
  grupo?: string;
  codigoComposicao?: string;
  tipo?: string;
  insumo?: string;
  summaryOnly?: boolean;
  page?: number;
  limit?: number;
  groupBy?: string;
}

// --- INTERFACE DE RETORNO (Composição) ---
export interface CompositionItem {
  _id: string;
  isGlobal: boolean;
  organizationId?: string;
  state: string;
  referenceMonth: number;
  referenceYear: number;
  grupo: string;
  codigoComposicao: string;
  tipo: string;
  insumo: string;
  descricao: string;
  unidade: string;
  coeficiente?: number;
  custo: number;
  isSummary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  items: CompositionItem[];
}

export interface CompositionDetail {
  summary: CompositionItem;
  items: CompositionItem[];
}

export interface UploadResponse {
  insertedCount: number;
  metadata: UploadPlanningPayload;
}

// --- SERVIÇO ---
const planningService = {
  /**
   * Upload de arquivo Excel com metadados (chamada direta ao NestJS)
   */
  async uploadFromExcel(
    file: File,
    metadata: UploadPlanningPayload
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isGlobal', String(metadata.isGlobal));
    if (metadata.organizationId) {
      formData.append('organizationId', metadata.organizationId);
    }
    formData.append('state', metadata.state);
    formData.append('referenceMonth', String(metadata.referenceMonth));
    formData.append('referenceYear', String(metadata.referenceYear));
    formData.append('grupo', metadata.grupo);

    const token = getTokenFromLocalStorage();

    const response = await fetch(`${NEST_API_URL}/planning/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    return handleResponse(response);
  },

  /**
   * Upload de arquivo Excel para atualização massiva de custos (chamada direta ao NestJS)
   */
  async uploadCostsFromExcel(
    file: File,
    metadata: UploadPlanningPayload
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isGlobal', String(metadata.isGlobal));
    if (metadata.organizationId) {
      formData.append('organizationId', metadata.organizationId);
    }
    formData.append('state', metadata.state);
    formData.append('referenceMonth', String(metadata.referenceMonth));
    formData.append('referenceYear', String(metadata.referenceYear));
    formData.append('grupo', metadata.grupo);

    const token = getTokenFromLocalStorage();

    const response = await fetch(`${NEST_API_URL}/planning/upload-costs`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    return handleResponse(response);
  },

  /**
   * Busca paginada com filtros e busca textual
   */
  async search(query: SearchPlanningQuery): Promise<SearchResponse | any> {
    const params = new URLSearchParams();

    if (query.q) {
      params.append('q', query.q);
      params.append('term', query.q);
    }

    if (query.isGlobal !== undefined) params.append('isGlobal', String(query.isGlobal));
    if (query.state) params.append('state', query.state);
    if (query.referenceMonth) params.append('referenceMonth', String(query.referenceMonth));
    if (query.referenceYear) params.append('referenceYear', String(query.referenceYear));
    if (query.grupo) params.append('grupo', query.grupo);
    if (query.codigoComposicao) params.append('codigoComposicao', query.codigoComposicao);
    if (query.tipo) params.append('tipo', query.tipo);
    if (query.insumo) params.append('insumo', query.insumo);
    if (query.summaryOnly !== undefined) params.append('summaryOnly', String(query.summaryOnly));
    if (query.page) params.append('page', String(query.page));
    if (query.limit) params.append('limit', String(query.limit));

    const res = await fetch(`${BASE_URL}/planning/search?${params.toString()}`);
    return handleResponse(res);
  },

  /**
   * Busca com agrupamento dinâmico
   */
  async grouped(query: SearchPlanningQuery): Promise<any> {
    const params = new URLSearchParams();

    if (query.q) params.append('q', query.q);
    if (query.isGlobal !== undefined) params.append('isGlobal', String(query.isGlobal));
    if (query.state) params.append('state', query.state);
    if (query.referenceMonth) params.append('referenceMonth', String(query.referenceMonth));
    if (query.referenceYear) params.append('referenceYear', String(query.referenceYear));
    if (query.grupo) params.append('grupo', query.grupo);
    if (query.groupBy) params.append('groupBy', query.groupBy);

    const res = await fetch(`${BASE_URL}/planning/grouped?${params.toString()}`);
    return handleResponse(res);
  },

  /**
   * Detalhe completo de uma composição (sumário + insumos)
   */
  async getCompositionItems(
    codigoComposicao: string,
    query?: Omit<SearchPlanningQuery, 'codigoComposicao'>
  ): Promise<CompositionDetail> {
    const params = new URLSearchParams();

    if (query?.q) params.append('q', query.q);
    if (query?.isGlobal !== undefined) params.append('isGlobal', String(query.isGlobal));
    if (query?.state) params.append('state', query.state);
    if (query?.referenceMonth) params.append('referenceMonth', String(query.referenceMonth));
    if (query?.referenceYear) params.append('referenceYear', String(query.referenceYear));

    const qs = params.toString();
    const res = await fetch(`${BASE_URL}/planning/composition/${encodeURIComponent(codigoComposicao)}/items${qs ? `?${qs}` : ''}`);
    const rawData = await handleResponse(res) as CompositionItem[];
    const dataArray = Array.isArray(rawData) ? rawData : [];

    const summary = dataArray.find((item: any) => item.isSummary) || dataArray[0] || {} as CompositionItem;
    const items = dataArray.filter((item: any) => item._id !== summary._id);

    return { summary, items };
  },
};

function getTokenFromLocalStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export default planningService;
