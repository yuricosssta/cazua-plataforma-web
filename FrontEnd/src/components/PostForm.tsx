// src/components/PostForm.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { IPost } from '@/types/IPost';
import MarkdownPreview from './MarkdownPreview';
import { AudioTranscriber } from './AudioTranscriber';
import { summarizeTextAPI } from '@/lib/api/summaryService';
import { Wand2, Save } from 'lucide-react';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useSelector } from 'react-redux';
import { markdownExample } from '@/lib/markdownExample';
import MDEditor from '@uiw/react-md-editor';

interface PostFormProps {
  onSubmit: (post: Omit<IPost, 'id'> | IPost) => void;
  initialData?: IPost | null;
  isLoading: boolean;
}

export default function PostForm({ onSubmit, initialData, isLoading }: PostFormProps) {
  const user = useSelector(selectCurrentUser);

  const getAuthorName = () => {
    if (initialData?.author) return initialData.author;
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return '';
  };

  const [post, setPost] = useState({
    title: '',
    image: '',
    description: '',
    content: initialData?.content || '',// || markdownExample(),
    published: true,
    author: getAuthorName(),
  });

  const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !post.author) {
      const fallbackName = user.name || user.email.split('@')[0];
      setPost(prev => ({ ...prev, author: fallbackName }));
    }
  }, [user, post.author]);

  useEffect(() => {
    if (initialData) {
      setPost({
        title: initialData.title,
        image: initialData.image || '',
        description: initialData.description || '',
        content: initialData.content,
        published: initialData.published !== undefined ? initialData.published : true,
        author: initialData.author || user?.name || '',
      });
    }
  }, [initialData, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setPost(prev => ({ ...prev, [name]: checked }));
    } else {
      setPost(prev => ({ ...prev, [name]: value }));
    }
  };

  // O MDEditor retorna o valor string diretamente, não um evento.
  const handleEditorChange = (value?: string) => {
    setPost(prev => ({ ...prev, content: value || '' }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const postDataToSubmit = {
      ...post,
      author: post.author || user?.name || 'Autor Desconhecido'
    };
    onSubmit(initialData ? { ...initialData, ...postDataToSubmit } : postDataToSubmit);
  };

  const organizaTexto = async (e: React.MouseEvent) => {
    e.preventDefault();
    const textToOrganize = post.content;

    if (!textToOrganize || !textToOrganize.trim()) {
      setOrganizeError('Por favor, insira um texto no conteúdo para organizar.');
      return;
    }

    setIsLoadingText(true);
    setOrganizeError(null);

    try {
      const result = await summarizeTextAPI(textToOrganize);
      setPost(prev => ({ ...prev, content: result }));
    } catch (err: any) {
      setOrganizeError("Erro ao organizar: " + err.message);
    } finally {
      setIsLoadingText(false);
    }
  };

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-xl border border-border shadow-sm">

      {/* Título */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium leading-none text-foreground">Título</label>
        <input
          type="text"
          name="title"
          id="title"
          value={post.title}
          onChange={handleChange}
          className={inputClass}
          placeholder="Digite o título do post..."
          required
        />
      </div>

      {/* Imagem */}
      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium leading-none text-foreground">URL da Imagem</label>
        <input
          type="url"
          name="image"
          id="image"
          value={post.image}
          onChange={handleChange}
          placeholder="https://exemplo.com/imagem.png"
          className={inputClass}
        />
      </div>

      {/* Conteúdo */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium leading-none text-foreground">Conteúdo</label>
        </div>

        <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
          <AudioTranscriber />
        </div>

        {/* <div data-color-mode="light"> */}
        <div>
          <MDEditor
            className={`${inputClass} `}
            value={post.content}
            onChange={handleEditorChange}
            height={300}
            preview="edit" // 'edit' mostra só o editor, 'live' mostra lado a lado
            textareaProps={{
              placeholder: 'Escreva seu conteúdo aqui...'
            }}
          />
        </div>

        {/* Botão Organizar */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isLoadingText}
            onClick={organizaTexto}
            className="button-0"
          >
            <Wand2 size={16} />
            {isLoadingText ? 'Organizando...' : 'Organizar conteúdo com IA'}
          </button>

          {organizeError && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {organizeError}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border my-6"></div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-foreground">Prévia Final:</p>
          <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            Dicas de Markdown
          </a>
        </div>
        <div className="rounded-md border border-border bg-background p-6 min-h-[150px]">
          <div className="typography">
            <MarkdownPreview markdown={post.content || "*A prévia aparecerá aqui...*"} />
          </div>
        </div>
      </div>

      {/* Publicar */}
      <div className="flex items-center space-x-2">
        <input
          id="published"
          name="published"
          type="checkbox"
          checked={post.published}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
        />
        <label htmlFor="published" className="text-sm font-medium text-foreground cursor-pointer">
          Publicar imediatamente
        </label>
      </div>

      {/* Salvar */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 gap-2 shadow-sm"
        >
          <Save size={18} />
          {isLoading ? 'Salvando...' : 'Salvar Publicação'}
        </button>
      </div>
    </form>
  );
}


// // src/components/PostForm.tsx
// "use client";

// import { useState, FormEvent, useEffect, use } from 'react';
// import { IPost } from '@/types/IPost';
// import MarkdownPreview from './MarkdownPreview';
// // import markdownExample from '@/lib/markdownExample'; // Se não estiver usando, pode remover ou descomentar
// import { AudioTranscriber } from './AudioTranscriber';
// import { summarizeTextAPI } from '@/lib/api/summaryService';
// import { Wand2, Save, User } from 'lucide-react'; // Adicionei ícones para melhorar a UX
// import { userAgent } from 'next/server';
// import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
// import { useSelector } from 'react-redux';
// import { markdownExample } from '@/lib/markdownExample';
// import { handleKeyDown, shortcuts, TextAreaCommandOrchestrator, getCommands } from '@uiw/react-md-editor';
// import React from 'react';


// interface PostFormProps {
//   onSubmit: (post: Omit<IPost, 'id'> | IPost) => void;
//   initialData?: IPost | null;
//   isLoading: boolean;
// }

// export default function PostForm({ onSubmit, initialData, isLoading }: PostFormProps) {
//   const user = useSelector(selectCurrentUser);

//   const getAuthorName = () => {
//     if (initialData?.author) return initialData.author;
//     if (user?.name) return user.name;
//     // Fallback: Se não tiver nome, pega a parte antes do @ do email, ou "Anônimo"
//     if (user?.email) return user.email.split('@')[0];
//     return '';
//   };

//   const [post, setPost] = useState({
//     title: '',
//     image: '',
//     description: '',
//     content: markdownExample(),
//     published: true,
//     author: getAuthorName(),
//   });

//   const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
//   const [organizeError, setOrganizeError] = useState<string | null>(null);

//   useEffect(() => {
//     if (user && !post.author) {
//       const fallbackName = user.name || user.email.split('@')[0];
//       setPost(prev => ({ ...prev, author: fallbackName }));
//     }
//   }, [user, post.author]);

//   useEffect(() => {
//     if (initialData) {
//       setPost({
//         title: initialData.title,
//         image: initialData.image || '',
//         description: initialData.description || '',
//         content: initialData.content,
//         published: initialData.published !== undefined ? initialData.published : true,
//         author: initialData.author || user?.name || '',
//       });
//     }
//   }, [initialData, user]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value, type } = e.target;

//     if (type === 'checkbox') {
//       const { checked } = e.target as HTMLInputElement;
//       setPost(prev => ({ ...prev, [name]: checked }));
//     } else {
//       setPost(prev => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();

//     const postDataToSubmit = {
//       ...post,
//       author: post.author || user?.name || 'Autor Desconhecido'
//     };

//     onSubmit(initialData ? { ...initialData, ...postDataToSubmit } : postDataToSubmit);
//     // onSubmit(initialData ? { ...initialData, ...post } : post);
//   };

//   const organizaTexto = async (e: React.MouseEvent) => {
//     e.preventDefault();

//     const textToOrganize = post.content;

//     if (!textToOrganize || !textToOrganize.trim()) {
//       setOrganizeError('Por favor, insira um texto no conteúdo para organizar.');
//       return;
//     }

//     setIsLoadingText(true);
//     setOrganizeError(null);

//     try {
//       console.log('Carregando texto...');
//       const result = await summarizeTextAPI(textToOrganize);
//       setPost(prev => ({ ...prev, content: result }));
//     } catch (err: any) {
//       setOrganizeError("Erro ao organizar: " + err.message);
//     } finally {
//       setIsLoadingText(false);
//     }
//   };

//   // Editor de Texto com Atalhos
//   const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
//   const orchestratorRef = React.useRef<TextAreaCommandOrchestrator | null>(null);
//   React.useEffect(() => {
//     if (post.content && textareaRef.current && !orchestratorRef.current) {
//       orchestratorRef.current = new TextAreaCommandOrchestrator(textareaRef.current);
//     }
//   }, []);

//   const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     handleKeyDown(e, 2, false);
//     if (orchestratorRef.current) {
//       shortcuts(e, getCommands(), orchestratorRef.current);
//     }
//   };

//   // Classe padrão para inputs no estilo Shadcn
//   const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground transition-all";

//   return (
//     <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-xl border border-border shadow-sm">

//       {/* Campo Título */}
//       <div className="space-y-2">
//         <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
//           Título
//         </label>
//         <input
//           type="text"
//           name="title"
//           id="title"
//           value={post.title}
//           onChange={handleChange}
//           className={inputClass}
//           placeholder="Digite o título do post..."
//           required
//         />
//       </div>

//       {/* Campo Imagem */}
//       <div className="space-y-2">
//         <label htmlFor="image" className="text-sm font-medium leading-none text-foreground">
//           URL da Imagem
//         </label>
//         <input
//           type="url"
//           name="image"
//           id="image"
//           value={post.image}
//           onChange={handleChange}
//           placeholder="https://exemplo.com/imagem.png"
//           className={inputClass}
//         />
//       </div>

//       {/* Campo Conteúdo */}
//       <div className="space-y-4">
//         <div className="flex justify-between items-center">
//           <label htmlFor="content" className="text-sm font-medium leading-none text-foreground">
//             Conteúdo
//           </label>
//           <div className="text-xs text-muted-foreground">
//             Suporta Markdown
//           </div>
//         </div>

//         {/* Transcritor de Áudio */}
//         <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
//           <AudioTranscriber />
//         </div>

//         {/* <MDEditor
//           value={post.content}
//           onChange={handleChange as any}
//         />
//         <MDEditor.Markdown source={post.content} style={{ whiteSpace: 'pre-wrap' }} /> */}

//         <textarea
//           ref={textareaRef}
//           name="content"
//           id="content"
//           rows={12}
//           value={post.content}
//           onChange={handleChange}
//           onKeyDown={onKeyDown}
//           className={`${inputClass} min-h-[200px] h-auto font-mono`}
//           //placeholder="# Comece a escrever aqui..."
//           // defaultValue="markdownExample()"
//           required
//         />

//         {/* Botão Organizar com IA */}
//         <div className="flex flex-col gap-2">
//           <button
//             type="button"
//             id="organize-button"
//             disabled={isLoadingText}
//             onClick={organizaTexto}
//             className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full sm:w-auto self-start gap-2"
//           >
//             <Wand2 size={16} />
//             {isLoadingText ? 'Organizando...' : 'Organizar conteúdo com IA'}
//           </button>

//           {organizeError && (
//             <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
//               {organizeError}
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="border-t border-border my-6"></div>

//       {/* Dicas e Preview */}
//       <div className="space-y-4">
//         <div className="flex justify-between items-center">
//           <p className="text-sm font-medium text-foreground">Prévia do conteúdo:</p>
//           <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
//             Dicas de Markdown
//           </a>
//         </div>

//         {/* Caixa de Preview com a classe typography */}
//         <div className="rounded-md border border-border bg-background p-6 min-h-[150px]">
//           <div className="typography">
//             <MarkdownPreview markdown={post.content || "*A prévia aparecerá aqui...*"} />
//           </div>
//         </div>
//       </div>

//       {/* Checkbox Publicado */}
//       <div className="flex items-center space-x-2">
//         <input
//           id="published"
//           name="published"
//           type="checkbox"
//           checked={post.published}
//           onChange={handleChange}
//           className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
//         />
//         <label htmlFor="published" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer">
//           Publicar imediatamente
//         </label>
//       </div>

//       {/* Botão Salvar */}
//       <div>
//         <button
//           type="submit"
//           disabled={isLoading}
//           className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 gap-2 shadow-sm"
//         >
//           <Save size={18} />
//           {isLoading ? 'Salvando...' : 'Salvar Publicação'}
//         </button>
//       </div>
//     </form>
//   );
// }

