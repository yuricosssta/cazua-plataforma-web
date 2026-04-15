import axiosInstance from '@/lib/api/axiosInstance';

// Interface para a resposta da API
interface TranscriptionResponse {
  text: string; // A API retorna um objeto com a chave 'text'
}

export const transcribeAudioAPI = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    //'/transcription'
    const response = await axiosInstance.post<TranscriptionResponse>('/transcription/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    //Retornar 'response.data.text'
    return response.data.text;

  } catch (error) {
    console.error('Erro ao chamar a API de transcrição:', error);
    throw new Error('Falha ao transcrever o áudio.');
  }
};