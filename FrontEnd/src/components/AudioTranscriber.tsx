"use client";

import { useState, useRef, DragEvent } from 'react';
import { TranscriptionModal } from './TranscriptionModal';
import { transcribeAudioAPI } from '@/lib/api/transcriptionService';

// Ícones (Lupa e Upload) como componentes SVG
const SearchIcon = () => (
  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const UploadIcon = () => (
  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V6a2 2 0 012-2h10a2 2 0 012 2v6a4 4 0 01-4 4H7zM10 9L12 7l2 2m-2 4v-4" /></svg>
);

export const AudioTranscriber = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referência para o input de arquivo escondido
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipula a seleção de arquivo (tanto do drop quanto do clique)
  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      // Validação simples de tipo
      if (selectedFile.type === 'audio/mpeg' || selectedFile.type === 'video/mp4') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Formato inválido. Por favor, envie um MP3 ou MP4.');
      }
    }
  };

  // --- Funções de Arrastar e Soltar ---
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files); 
  };

  // --- Funções de Clique ---
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChangeFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  // --- Função Principal: Transcrever ---
  const handleTranscribe = async () => {
    if (!file) {
      setError('Nenhum arquivo selecionado.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setTranscription('');

    try {
      const resultText = await transcribeAudioAPI(file);
      setTranscription(resultText);
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex items-start gap-4">
        {/* Área de Arrastar e Soltar */}
        <div
          className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${file ? 'border-green-500 bg-green-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {/* Input de arquivo escondido */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChangeFromInput}
            accept="audio/mpeg,video/mp4" // Aceita .mp3 e .mp4
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            {file ? (
              <>
                <UploadIcon />
                <span className="mt-2 text-sm font-medium text-green-700">Arquivo Carregado:</span>
                <span className="text-xs text-gray-600">{file.name}</span>
              </>
            ) : (
              <>
                <SearchIcon />
                <span className="mt-2 text-sm font-medium text-gray-700">
                  Arraste um arquivo MP3/MP4 ou clique para procurar
                </span>
                <span className="text-xs text-gray-500">(Lupa)</span>
              </>
            )}
          </div>
        </div>

        {/* Botão Transcrever */}
        <button
          onClick={handleTranscribe}
          disabled={!file || isLoading}
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full sm:w-auto self-start gap-2"            
          // className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md
          //            hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Transcrevendo...' : 'Transcrever Áudio'}
        </button>
      </div>
      
      {/* Mensagem de Erro */}
      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      {/* Pop-up (Modal) */}
      {isModalOpen && (
        <TranscriptionModal
          text={transcription}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};