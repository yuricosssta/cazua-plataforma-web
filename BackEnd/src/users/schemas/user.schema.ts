// src/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRule } from './models/user.interface';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password?: string;

  @Prop({ required: true })
  isAdmin: boolean;

  @Prop({ required: true })
  rule: UserRule;

  @Prop({ required: false })
  avatarUrl?: string;

  @Prop({ required: false })
  resetPasswordToken: string;

  @Prop({ required: false })
  resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
