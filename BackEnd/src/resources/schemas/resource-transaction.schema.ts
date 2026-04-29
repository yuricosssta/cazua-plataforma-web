//src/resources/schemas/resource-transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionType, TransactionStatus } from '../types/resource-enums';

export type ResourceTransactionDocument = ResourceTransaction & Document;

@Schema({ timestamps: true })
export class ResourceTransaction {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Resource' })
  resourceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  authorId: Types.ObjectId; 

  @Prop({ type: String, enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.APPROVED })
  status: TransactionStatus; 

  @Prop({ type: Number, required: true })
  quantity: number; 

  @Prop({ type: Number, required: true })
  unitCostSnapshot: number;

  @Prop({ type: Number, required: true })
  totalCost: number;

  @Prop()
  origin?: string;

  @Prop({ type: Boolean, default: false })
  isStockNegative: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  // --- CAMPOS DE AUDITORIA DE REQUISIÇÃO (RM) ---
  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId; // Quem do almoxarifado aprovou

  @Prop()
  rejectedReason?: string; 

  // --- CAMPOS DE ESTORNO ---
  @Prop({ type: Boolean, default: false })
  isCanceled: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  canceledBy?: Types.ObjectId;

  @Prop()
  cancelReason?: string;
}

export const ResourceTransactionSchema = SchemaFactory.createForClass(ResourceTransaction);