// BackEnd/src/projects/schemas/timeline-event.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TimelineEventDocument = TimelineEvent & Document;

export enum TimelineEventType {
  COMMENT = 'COMMENT',             // Alguém comentou algo
  STATUS_CHANGE = 'STATUS_CHANGE', // A obra mudou de fase
  DOCUMENT = 'DOCUMENT',           // Um TAP ou Projeto Básico foi anexado
  REPORT = 'REPORT',               // Diário de Obra preenchido
}

@Schema({ timestamps: true })
export class TimelineEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true })
  organizationId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  authorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(TimelineEventType), required: true })
  type: TimelineEventType;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, unique: true, sparse: true })
  parecerCode?: string;

  // Campo flexível para guardar dados extras. 
  // Ex: Se o tipo for STATUS_CHANGE, podemos guardar { oldStatus: 'DEMAND', newStatus: 'PLANNING' }
  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, any>;
}

export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);