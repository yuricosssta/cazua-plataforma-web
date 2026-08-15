//src/landing-pages/schemas/lead.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'leads' })
export class Lead extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  company?: string;

  @Prop()
  message?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);