// src/posts/repositories/post.repository.ts

import { IPost } from '../schemas/models/post.interface';

export interface PaginateOptions {
  limit: number;
  skip: number;
  organizationId?: string;
}

export abstract class PostRepository {
  abstract getAllPosts(options: PaginateOptions): Promise<IPost[]>;
  abstract getTotalPostsCount(organizationId?: string): Promise<number>;
  abstract getPost(postId: string): Promise<IPost>;
  abstract createPost(post: IPost): Promise<IPost>;
  abstract searchPost(term: string): Promise<IPost[]>;
  abstract updatePost(
    postId: string,
    post: Partial<IPost>,
  ): Promise<IPost | null>;
  abstract deletePost(postId: string): Promise<IPost | null>;
}