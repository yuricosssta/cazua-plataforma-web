//src/lib/services/summaryService.ts
import { CreateRellDto } from '@/validations/summary.zod';
import axiosInstance from '@/app/api/axiosInstance'; // Ajuste o caminho se sua instância estiver em outro diretório

export const summaryService = {
  /**
   * Envia um texto para a API de resumo via BFF.
   */
  async summarizeText(text: string): Promise<string> {
    try {
      const response = await axiosInstance.post(
        '/api/summary/text',
        { text },
        { baseURL: '' } // Sobrescreve a base URL para rotear para o BFF do Next.js
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Não foi possível gerar o resumo. Entre em contato com o suporte se persistir.'
      );
    }
  },

  /**
   * Envia os dados do formulário para geração de roteiro de publicidade via BFF.
   */
  async generateReel(data: CreateRellDto): Promise<string> {
    try {
      const response = await axiosInstance.post(
        '/api/summary/reels/generate',
        data,
        { baseURL: '' } // Sobrescreve a base URL para rotear para o BFF do Next.js
      );
      return response.data; // O Axios converte text/plain para string automaticamente
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Erro ao gerar o conteúdo de publicidade.'
      );
    }
  }
};