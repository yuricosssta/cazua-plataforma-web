import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Planning {
  @Prop({ required: true, index: true })
  isGlobal: boolean;

  @Prop({ type: String, default: null, index: true })
  organizationId: string | null;

  @Prop({ required: true, index: true })
  state: string;

  @Prop({ required: true, index: true })
  referenceMonth: number;

  @Prop({ required: true, index: true })
  referenceYear: number;

  @Prop({ required: true, index: true })
  grupo: string;

  @Prop({ required: true, index: true })
  codigoComposicao: string;

  @Prop({ default: '' })
  tipo: string;

  @Prop({ default: '' })
  insumo: string;

  @Prop({ default: '' })
  descricao: string;

  @Prop({ default: '' })
  unidade: string;

  @Prop({ type: Number, default: null })
  coeficiente: number | null;

  @Prop({ default: '' })
  custo: string;

  @Prop({ default: false, index: true })
  isSummary: boolean;
}

export type PlanningDocument = Planning & Document;
export const PlanningSchema = SchemaFactory.createForClass(Planning);

PlanningSchema.index({ descricao: 'text', grupo: 'text', tipo: 'text', insumo: 'text', codigoComposicao: 'text', custo: 'text' });
