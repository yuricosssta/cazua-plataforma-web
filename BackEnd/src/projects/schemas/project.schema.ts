// BackEnd/src/projects/schemas/project.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
  DEMAND = 'DEMAND',
  PLANNING = 'PLANNING',
  EXECUTION = 'EXECUTION',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String })
  technicalTitle?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.DEMAND })
  status: ProjectStatus;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ required: true })
  location: string;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Number, min: 1, max: 125 })
  priorityScore?: number;

  // Guarda as respostas exatas que geraram o score (Ex: { gravidade: 5, urgencia: 5, tendencia: 5 })
  @Prop({ type: MongooseSchema.Types.Mixed })
  priorityDetails?: Record<string, number>;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedMembers: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TimelineEvent' })
  lastEventId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);