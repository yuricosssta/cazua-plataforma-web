// src/posts/repositories/post.repository.ts

import { IPost } from '../schemas/models/post.interface';

// Movi a interface para cá para que o Service e a Implementação usem a mesma definição
export interface PaginateOptions {
  limit: number;
  skip: number;
  organizationId?: string; // Novo campo opcional para filtro
}

export abstract class PostRepository {
  abstract getAllPosts(options: PaginateOptions): Promise<IPost[]>;
  
  // Atualizado para receber o filtro na contagem também
  abstract getTotalPostsCount(organizationId?: string): Promise<number>;
  
  abstract getPost(postId: string): Promise<IPost>;
  
  // Atualizado retorno de void para IPost (para o Service poder retornar o dado)
  abstract createPost(post: IPost): Promise<IPost>;
  
  abstract searchPost(term: string): Promise<IPost[]>;

  abstract updatePost(
    postId: string,
    post: Partial<IPost>,
  ): Promise<IPost | null>;

  abstract deletePost(postId: string): Promise<IPost | null>;
}

// import { IPost } from '../schemas/models/post.interface';
// import { PaginateOptions } from './mongoose/post.mongoose.repository';

// export abstract class PostRepository {
//   // abstract getAllPosts(): Promise<IPost[]>;
//   abstract getAllPosts(options: PaginateOptions): Promise<IPost[]>;
//   abstract getTotalPostsCount(): Promise<number>;
//   abstract getPost(postId: string): Promise<IPost>;
//   abstract createPost(post: IPost): Promise<void>;
//   abstract searchPost(term: string): Promise<IPost[]>;

//   abstract updatePost(
//     postId: string,
//     post: Partial<IPost>,
//   ): Promise<IPost | null>;

//   abstract deletePost(postId: string): Promise<IPost | null>;
// }
