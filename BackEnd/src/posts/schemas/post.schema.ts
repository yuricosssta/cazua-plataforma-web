//src/posts/schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IPost } from './models/post.interface';
import mongoose, { HydratedDocument } from 'mongoose';

export type PostsDocument = HydratedDocument<Post>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } })
export class Post implements IPost {

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  id?: string;
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', // Isso permite usar .populate('organizationId') no futuro
    required: false,     // Permite salvar posts sem empresa
    index: true          // CRUCIAL: Deixa as buscas por empresa rápidas
  })
  organizationId?: string;
  @Prop({ required: true })
  title: string;
  @Prop()
  description: string;
  @Prop({ required: true })
  content: string;
  @Prop()
  created_at?: Date;
  @Prop()
  modified_at?: Date;
  @Prop()
  image?: string;
  @Prop({ type: String, required: false })
  author?: string;
  @Prop()
  published?: boolean;
}

export const PostsSchema = SchemaFactory.createForClass(Post);
