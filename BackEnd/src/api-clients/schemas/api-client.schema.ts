import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiClientDocument = ApiClient & Document;

@Schema({ timestamps: true })
export class ApiClient {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  clientId: string;

  @Prop({ required: true })
  secretHash: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Organization' }], default: [] })
  allowedOrgIds: Types.ObjectId[];

  @Prop({ required: true, default: 'MEMBER', enum: ['MEMBER', 'VIEWER'] })
  defaultRole: 'MEMBER' | 'VIEWER';

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  ownerUserId?: Types.ObjectId | null;

  @Prop({ type: String, required: false, default: null })
  resetPasswordUrl?: string | null;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const ApiClientSchema = SchemaFactory.createForClass(ApiClient);
