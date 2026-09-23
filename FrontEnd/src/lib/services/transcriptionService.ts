const NEST_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const store = (window as any).__NEXT_REDUX_STORE__;
  if (!store) return {};
  const state = store.getState();
  const token = state.auth?.token;
  const currentOrg = state.organizations?.currentOrganization;
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (currentOrg?.organizationId?._id) {
    headers['x-org-id'] = currentOrg.organizationId._id;
    headers['x-org-role'] = currentOrg.role;
  }
  return headers;
}

// Interface para a resposta da API
interface TranscriptionResponse {
  text: string;
}

export const transcribeAudioAPI = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${NEST_API_URL}/transcription/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Falha ao transcrever o áudio.');
    }

    const data: TranscriptionResponse = await response.json();
    return data.text;

  } catch (error) {
    console.error('Erro ao chamar a API de transcrição:', error);
    throw new Error('Falha ao transcrever o áudio.');
  }
};