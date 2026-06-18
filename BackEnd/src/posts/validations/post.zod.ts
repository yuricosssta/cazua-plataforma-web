//BackEnd/src/posts/validations/post.zod.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(2, 'O título é obrigatório e deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  content: z.string().min(5, 'O conteúdo é obrigatório'),
  image: z.string().url('Formato de URL inválido').optional().or(z.literal('')),
  author: z.string().optional(),
  published: z.boolean().default(true),
});

export const updatePostSchema = createPostSchema.partial();

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type UpdatePostDto = z.infer<typeof updatePostSchema>;