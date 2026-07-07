//src/lib/services/summaryService.ts
import { CreateReelDto } from '@/validations/summary.zod';
import axiosInstance from '@/app/api/axiosInstance'; // Ajuste o caminho se sua instância estiver em outro diretório

export const summaryService = {
  
  async summarizeText(text: string): Promise<string> {
    try {
      const response = await axiosInstance.post(
        '/api/summary/text',
        { text },
        { baseURL: '' } // Sobrescreve para rotear para o BFF
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Não foi possível gerar o resumo. Entre em contato com o suporte se persistir.'
      );
    }
  },

  
  async generateReel(data: CreateReelDto): Promise<string> {
    try {
      const response = await axiosInstance.post(
        '/api/summary/reels/generate',
        data,
        { baseURL: '' } // Sobrescreve a base URL para rotear para o BFF
      );
      return response.data; // O Axios converte text/plain para string automaticamente
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Erro ao gerar o conteúdo de publicidade.'
      );
    }
  }
};