// src/types/post.ts
export interface IPost {
  id?: string;
  title: string;
  content: string;
  description?: string;
  created_at?: Date | string;
  modified_at?: Date | string;
  image?: string;
  author?: string;
  published?: boolean;
  organizationId?: string;
}