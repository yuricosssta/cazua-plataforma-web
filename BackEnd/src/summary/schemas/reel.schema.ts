//src/summary/schemas/Reel.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IReels } from './models/reel.interface';
import mongoose, { HydratedDocument } from 'mongoose';

export type ReelsDocument = HydratedDocument<IReels>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } })
export class Reels implements IReels {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  id?: string;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false,
    index: true,
  })
  organizationId: string;
  @Prop({ required: true })
  tema: string;
  @Prop()
  publico_alvo: string;
  @Prop({ required: true })
  conteudo_tipo: string;
  @Prop({ required: true })
  linha_editorial: string;
  @Prop({ required: true })
  objetivo: string;
  @Prop({ required: true })
  duracao: string;
  @Prop({ required: true })
  tom_voz: string;
  @Prop({ required: true })
  saida: string;
  @Prop({ required: true })
  rascunho: string;
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

export const ReelsSchema = SchemaFactory.createForClass(Reels);
