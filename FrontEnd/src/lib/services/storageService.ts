//src/lib/services/storageService.ts
import axios from "axios";
import imageCompression from 'browser-image-compression';

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

export async function uploadFileToR2(file: File): Promise<string> {
  try {
    let fileToUpload = file;

    // MOTOR DE COMPRESSÃO E CORREÇÃO DE ROTAÇÃO (Apenas para imagens)
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      console.log(`Comprimindo imagem... Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      fileToUpload = await imageCompression(file, options);
      console.log(`Imagem comprimida! Novo tamanho: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Pede a URL assinada (chamada direta ao NestJS)
    const authResponse = await fetch(`${NEST_API_URL}/storage/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        sizeBytes: fileToUpload.size,
      }),
    });

    if (!authResponse.ok) {
      const errData = await authResponse.json().catch(() => ({}));
      throw new Error(errData.message || 'Falha ao obter URL assinada');
    }

    const { uploadUrl, fileUrl } = await authResponse.json();

    // Upload Direto para a Cloudflare (Axios limpo sem JWT)
    await axios.put(uploadUrl, fileToUpload, {
      headers: { 'Content-Type': fileToUpload.type },
    });

    // Avisa a portaria que o arquivo subiu (chamada direta ao NestJS)
    const confirmResponse = await fetch(`${NEST_API_URL}/storage/confirm-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        fileUrl: fileUrl,
        fileName: fileToUpload.name,
        mimeType: fileToUpload.type,
        sizeBytes: fileToUpload.size,
      }),
    });

    if (!confirmResponse.ok) {
      const errData = await confirmResponse.json().catch(() => ({}));
      throw new Error(errData.message || 'Falha ao confirmar upload');
    }

    return fileUrl;

  } catch (error: any) {
    console.error("Erro no serviço central de upload:", error);

    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Falha ao processar o upload do arquivo.");
  }
}