//src/posts/services/post.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PostRepository } from '../repositories/post.repository';
import { IPost } from '../schemas/models/post.interface';

export interface PaginatedPostsResult {
  data: IPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) { }

  // Adicionado o parâmetro opcional organizationId
  async getAllPosts(page: number, limit: number, organizationId?: string): Promise<PaginatedPostsResult> {
    const skip = (page - 1) * limit;

    // Passamos o organizationId para o repositório filtrar (se ele existir)
    const [posts, total] = await Promise.all([
      this.postRepository.getAllPosts({ limit, skip, organizationId }),
      this.postRepository.getTotalPostsCount(organizationId),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async searchPost(term: string) {
    const post = this.postRepository.searchPost(term);
    return post;
  }

  async getPost(postId: string) {
    const post = await this.postRepository.getPost(postId);
    if (!post) throw new NotFoundException('Post não encontrado');
    return post;
  }

  async createPost(post: IPost) {
    // Como adicionamos o campo organizationId no Schema e Interface,
    // o spread operator (...post) já vai passar o ID automaticamente se ele vier do DTO.
    const newPost = await this.postRepository.createPost({
      ...post
    });
    return newPost;
  }

  async updatePost(postId: string, post: Partial<IPost>) {
    const updatedPost = await this.postRepository.updatePost(postId, post);
    if (!updatedPost) throw new NotFoundException('Post não encontrado');
    return updatedPost;
  }

  async deletePost(postId: string, orgId?: any) {
    const deletedPost = await this.postRepository.deletePost(postId);
    if (!deletedPost) throw new NotFoundException('Post não encontrado');
    return { message: `Post com id ${postId} deletado com sucesso.` };
  }
}

// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PostRepository } from '../repositories/post.repository';
// import { IPost } from '../schemas/models/post.interface';
// import { IUser } from '../../users/schemas/models/user.interface';

// export interface PaginatedPostsResult {
//   data: IPost[];
//   total: number;
//   page: number;
//   limit: number;
//   totalPages: number;
// }

// @Injectable()
// export class PostService {
//   constructor(private readonly postRepository: PostRepository) { }

//   // async getAllPosts() {
//   //   const posts = await this.postRepository.getAllPosts();
//   //   return posts;
//   // }

//   async getAllPosts(page: number, limit: number): Promise<PaginatedPostsResult> {
//     const skip = (page - 1) * limit; //calcula quantos documentos pular
//     const [posts, total] = await Promise.all([
//       this.postRepository.getAllPosts({ limit, skip }),
//       this.postRepository.getTotalPostsCount(),
//     ]);

//     // Calcula o total de páginas
//     const totalPages = Math.ceil(total / limit);

//     return {
//       data: posts,
//       total,
//       page,
//       limit,
//       totalPages,
//     };
//   }

//   async searchPost(term: string) {
//     const post = this.postRepository.searchPost(term);
//     return post;
//   }

//   async getPost(postId: string) {
//     const post = await this.postRepository.getPost(postId);
//     if (!post) throw new NotFoundException('Post não encontrado');
//     return post;
//   }

//   async createPost(post: IPost) {
//     const newPost = await this.postRepository.createPost({
//       ...post
//     });
//     return newPost;
//   }

//   // async createPost(post: IPost, user: IUser) {
//   //   const newPost = await this.postRepository.createPost({
//   //     ...post,
//   //     author: user.name,
//   //   });

//   //   return newPost;
//   // }

//   async updatePost(postId: string, post: Partial<IPost>) {
//     const updatedPost = await this.postRepository.updatePost(postId, post);
//     if (!updatedPost) throw new NotFoundException('Post não encontrado');
//     return updatedPost;
//   }

//   async deletePost(postId: string) {
//     const deletedPost = await this.postRepository.deletePost(postId);
//     if (!deletedPost) throw new NotFoundException('Post não encontrado');
//     return { message: `Post com id ${postId} deletado com sucesso.` };
//   }
// }
