// src/components/posts/PostForm.tsx
"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { IPost } from '@/types/post';
import MarkdownPreview from './MarkdownPreview';
import { AudioTranscriber } from '../AudioTranscriber';
import { summarizeTextAPI } from '@/lib/services/summaryService';
import { Wand2, Save, AlertCircle } from 'lucide-react';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useSelector } from 'react-redux';
import MDEditor from '@uiw/react-md-editor';

interface PostFormProps {
  onSubmit: (post: Omit<IPost, 'id'> | IPost) => void;
  initialData?: IPost | null;
  isLoading: boolean;
  serverError?: string | null; // Nova propriedade
}

export default function PostForm({ onSubmit, initialData, isLoading, serverError }: PostFormProps) {
  const user = useSelector(selectCurrentUser);
  const { theme } = useTheme();

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
    content: initialData?.content || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setPost(prev => ({ ...prev, [name]: checked }));
    } else {
      setPost(prev => ({ ...prev, [name]: value }));
    }
  };

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
    if (!post.content || !post.content.trim()) {
      setOrganizeError('Insira um texto no conteúdo para organizar.');
      return;
    }

    setIsLoadingText(true);
    setOrganizeError(null);

    try {
      const result = await summarizeTextAPI(post.content);
      setPost(prev => ({ ...prev, content: result }));
    } catch (err: any) {
      setOrganizeError("Erro ao organizar: " + err.message);
    } finally {
      setIsLoadingText(false);
    }
  };

  const inputClass = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-md border border-border shadow-sm">
      
      {/* Exibição de Erro do Servidor / Zod */}
      {serverError && (
        <div className="flex items-center gap-2 p-4 text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle size={18} className="shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium leading-none text-foreground">Título</label>
        <input
          type="text"
          name="title"
          id="title"
          value={post.title}
          onChange={handleChange}
          className={`${inputClass} h-10`}
          placeholder="Digite o título do post..."
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium leading-none text-foreground">Resumo / Descrição</label>
        <textarea
          name="description"
          id="description"
          value={post.description}
          onChange={handleChange}
          className={`${inputClass} min-h-[80px] resize-y`}
          placeholder="Breve resumo da publicação..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium leading-none text-foreground">URL da Imagem</label>
        <input
          type="url"
          name="image"
          id="image"
          value={post.image}
          onChange={handleChange}
          placeholder="https://exemplo.com/imagem.png"
          className={`${inputClass} h-10`}
        />
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium leading-none text-foreground">Conteúdo</label>
        
        <div className="p-4 border border-dashed border-border rounded-md bg-muted/30">
          <AudioTranscriber />
        </div>

        <div data-color-mode={theme === 'dark' ? 'dark' : 'light'} className="rounded-md overflow-hidden border border-input">
          <MDEditor
            className="!h-auto min-h-[300px] border-none"
            value={post.content}
            onChange={handleEditorChange}
            height={300}
            preview="edit"
            textareaProps={{
              placeholder: 'Escreva seu conteúdo aqui...'
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={isLoadingText}
            onClick={organizaTexto}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full sm:w-auto self-start gap-2"
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

      <div className="flex items-center space-x-2">
        <input
          id="published"
          name="published"
          type="checkbox"
          checked={post.published}
          onChange={handleChange}
          className="h-4 w-4 rounded border-border text-primary focus:ring-ring bg-background"
        />
        <label htmlFor="published" className="text-sm font-medium text-foreground cursor-pointer">
          Publicar imediatamente
        </label>
      </div>

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