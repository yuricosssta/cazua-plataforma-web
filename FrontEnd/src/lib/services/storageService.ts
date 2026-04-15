//src/lib/services/storageService.ts
import axiosInstance from "@/lib/api/axiosInstance";
import axios from "axios";

export async function uploadFileToR2(file: File): Promise<string> {
  try {
    // Pede a URL assinada (Agora enviando o tamanho do arquivo para a trava do limite)
    const authResponse = await axiosInstance.post('/storage/presigned-url', {
      fileName: file.name,
      fileType: file.type,
      sizeBytes: file.size 
    });

    const { uploadUrl, fileUrl } = authResponse.data;

    // Upload Direto para a Cloudflare (Axios limpo sem JWT)
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      }
    });

    // Avisa a portaria que o arquivo subiu para contabilizar os Megabytes
    await axiosInstance.post('/storage/confirm-upload', {
      fileUrl: fileUrl,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    });

    // Retorna a URL pública limpa para o componente usar
    return fileUrl;

  } catch (error: any) {
    console.error("Erro no serviço central de upload:", error);
    
    // Repassa o erro legível do backend (Ex: "LIMITE DE ARMAZENAMENTO EXCEDIDO")
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Falha ao processar o upload do arquivo.");
  }
}