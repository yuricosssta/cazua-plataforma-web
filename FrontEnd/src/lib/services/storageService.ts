//src/lib/services/storageService.ts
import axiosInstance from "@/lib/api/axiosInstance";
import axios from "axios";
import imageCompression from 'browser-image-compression';

export async function uploadFileToR2(file: File): Promise<string> {
  try {
    let fileToUpload = file;

    // MOTOR DE COMPRESSÃO E CORREÇÃO DE ROTAÇÃO (Apenas para imagens)
    if (file.type.startsWith('image/')) {
      const options = {
        maxSizeMB: 1, // Trava o tamanho máximo da imagem em 1 Megabyte
        maxWidthOrHeight: 1920, // Redimensiona fotos gigantes (ex: 4K do iPhone) para Full HD
        useWebWorker: true, // Usa processamento paralelo para não travar a tela
        // A biblioteca já corrige a rotação do celular automaticamente!
      };
      
      console.log(`Comprimindo imagem... Tamanho original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      fileToUpload = await imageCompression(file, options);
      console.log(`Imagem comprimida! Novo tamanho: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // Pede a URL assinada (Agora enviando o tamanho do arquivo já reduzido)
    const authResponse = await axiosInstance.post('/storage/presigned-url', {
      fileName: fileToUpload.name,
      fileType: fileToUpload.type,
      sizeBytes: fileToUpload.size 
    });

    const { uploadUrl, fileUrl } = authResponse.data;

    // Upload Direto para a Cloudflare (Axios limpo sem JWT)
    await axios.put(uploadUrl, fileToUpload, {
      headers: {
        'Content-Type': fileToUpload.type,
      }
    });

    // Avisa a portaria que o arquivo subiu para contabilizar os Megabytes reais
    await axiosInstance.post('/storage/confirm-upload', {
      fileUrl: fileUrl,
      fileName: fileToUpload.name,
      mimeType: fileToUpload.type,
      sizeBytes: fileToUpload.size
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