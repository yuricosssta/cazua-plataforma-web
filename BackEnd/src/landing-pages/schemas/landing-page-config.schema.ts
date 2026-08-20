//src/landing-pages/schemas/landing-page-config.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class ThemeConfig {
  @Prop({ required: true })
  primaryHSL: string;

  @Prop()
  backgroundHSL?: string;

  @Prop()
  foregroundHSL?: string;
}

const ThemeConfigSchema = SchemaFactory.createForClass(ThemeConfig);

@Schema({ timestamps: true, collection: 'landing_page_configs' })
export class LandingPageConfig extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true, unique: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  domain: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  logoUrl?: string;

  @Prop({ required: true })
  heroTitle: string;

  @Prop({ required: true })
  heroSubtitle: string;

  @Prop({ type: String, required: false })
  contentMDX?: string;

  @Prop({ type: ThemeConfigSchema, required: true })
  theme: ThemeConfig;

  @Prop({ default: true })
  isActive: boolean;
}

export const LandingPageConfigSchema =
  SchemaFactory.createForClass(LandingPageConfig);
//fim
