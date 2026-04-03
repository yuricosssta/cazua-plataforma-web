export interface IPost {
  _id?: string;
  title: string;
  content: string;
  description?: string;
  created_at?: Date; 
  modified_at?: Date;
  image?: string;
  author?: string;
  published?: boolean;
}