import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ResourceType } from '../types/resource-enums';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ResourceType, required: true })
  type: ResourceType;

  @Prop({ required: true }) // Ex: "Saco", "Hora", "R$", "Diária"
  unit: string;

  @Prop({ type: Number, default: 0 })
  standardCost: number; // Custo base fornecido pelo usuário

  @Prop({ type: Number, default: 0 })
  currentStock: number; // Saldo atual no Almoxarifado Central
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
// Index para busca rápida por organização e nome
ResourceSchema.index({ organizationId: 1, name: 1 });