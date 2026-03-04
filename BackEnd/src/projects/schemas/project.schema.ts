// BackEnd/src/projects/schemas/project.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProjectDocument = Project & Document;

export enum ProjectStatus {
  DEMAND = 'DEMAND',
  PLANNING = 'PLANNING',
  EXECUTION = 'EXECUTION',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true })
export class Project {
  // A trava de segurança: A qual construtora/prefeitura pertence
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  title: string;

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

  // Preparando o terreno para as fotos e PDFs (S3)
  @Prop({ type: [String], default: [] })
  attachments: string[];

  // Denormalização inteligente: Guardamos o ID do último evento para a listagem ficar super rápida, 
  // sem precisar fazer JOIN complexo na hora de renderizar os Cards.
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TimelineEvent' })
  lastEventId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);