"use client";

import { useState } from 'react';

interface TranscriptionModalProps {
  text: string;
  onClose: () => void;
}

export const TranscriptionModal = ({ text, onClose }: TranscriptionModalProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    // Usa a API do navegador para copiar o texto
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      // Reseta o estado do botão após 2 segundos
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Modal */}
      <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold mb-4">Transcrição Concluída</h2>
        
        {/* Área do Texto */}
        <textarea
          readOnly
          value={text}
          className="w-full h-64 p-2 border border-gray-300 rounded-md bg-gray-50 text-black"
        />
        
        {/* Botões */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Fechar
          </button>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-md text-white ${
              isCopied
                ? 'bg-green-500' // Cor de sucesso
                : 'bg-blue-600 hover:bg-blue-700' // Cor padrão
            }`}
          >
            {isCopied ? 'Copiado!' : 'Copiar Texto'}
          </button>
        </div>
      </div>
    </div>
  );
};