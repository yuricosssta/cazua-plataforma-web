import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType } from '../types/resource-enums';

export type ResourceTransactionDocument = ResourceTransaction & Document;

@Schema({ timestamps: true })
export class ResourceTransaction {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' }) // Null se for entrada geral no estoque
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Resource' })
  resourceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitCostSnapshot: number; // Preço do recurso no momento da transação

  @Prop({ type: Number, required: true })
  totalCost: number; // quantity * unitCostSnapshot

  @Prop()
  origin?: string; // Ex: "Nota Fiscal 450", "Aporte Sócio X", "Saldo Inicial"

  @Prop({ type: Boolean, default: false })
  isStockNegative: boolean; // Flag para o aviso que você solicitou

  @Prop({ type: [String], default: [] })
  attachments: string[]; // anexos

  @Prop({ type: Boolean, default: false })
  isCanceled: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  canceledBy?: Types.ObjectId;

  @Prop()
  cancelReason?: string;
}

export const ResourceTransactionSchema = SchemaFactory.createForClass(ResourceTransaction);