import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/summary/text`; 

/**
 * Envia um texto para a API de resumo e retorna o resumo em string.
 * @param text O texto a ser resumido.
 * @returns Uma Promise que resolve para o texto resumido.
 */
export const summarizeTextAPI = async (text: string): Promise<string> => {
  try {
    const response = await axios.post(API_URL, {
      text: text, 
    });
    
    return response.data;
  } catch (error) {
    // Trata erros de rede ou da API
    console.error('Erro ao chamar a API de resumo:', error);
    // Lança um erro para que o componente possa tratá-lo
    throw new Error('Não foi possível gerar o resumo. Entre em contato com o suporte se persistir.');
  }
};