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

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  ownerUserId?: Types.ObjectId;

  @Prop({ required: false })
  resetPasswordUrl?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const ApiClientSchema = SchemaFactory.createForClass(ApiClient);
