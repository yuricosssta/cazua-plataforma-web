"use client";

import { useState } from 'react';
import { summarizeTextAPI } from '@/lib/services/summaryService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const TextSummarizer = () => {
  const [inputText, setInputText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Função chamada quando o formulário é enviado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o recarregamento da página

    if (!inputText.trim()) {
      setError('Por favor, insira um texto para resumir.');
      return;
    }

    setIsLoading(true); // Ativa o indicador de carregamento
    setSummary('');     // Limpa o resumo anterior
    setError(null);     // Limpa o erro anterior

    try {
      const result = await summarizeTextAPI(inputText);
      // Atualiza o estado com o resultado
      setSummary(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      // Desativa o indicador de carregamento, independentemente do resultado
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 border rounded-md shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Resumidor de Texto</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
            Cole o texto que você deseja organizar e resumir:
          </label>
          <textarea
            id="text-input"
            rows={10}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-black"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Insira o texto aqui..."
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Organizando...' : 'Gerar organização'}
        </button>
      </form>

      {/* Área de Resultado */}
      <div className="mt-6">
        {/* Exibe o erro, se houver */}
        {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md">{error}</div>}

        {/* Exibe o resumo, se houver */}
        {summary && (
          <div className="p-4 bg-gray-50 rounded-md border">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Texto organizado:</h3>
            <article className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {summary}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
};