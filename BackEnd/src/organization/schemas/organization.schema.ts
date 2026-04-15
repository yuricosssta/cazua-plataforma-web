//src/organization/schemas/organization.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

class OrganizationSettings {
  @Prop({ type: String, required: false })
  logoUrl?: string;

  @Prop({ type: String, required: false })
  headerUrl?: string;

  @Prop({ type: String, required: false })
  footerUrl?: string;
}

@Schema({
  timestamps: true, // Cria automaticamente createdAt e updatedAt
  collection: 'organizations'
})
export class Organization {

  // O nome de exibição (ex: "Construtora Silva & Filhos")
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, unique: true })
  cnpj: string;

  @Prop({ required: true, uppercase: true, trim: true, maxlength: 4 })
  acronym: string;

  @Prop({ type: String, enum: ['FREE', 'PRO', 'ENTERPRISE'], default: 'FREE' })
  plan: string;

  // O identificador único na URL (ex: "construtora-silva")
  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Number, default: 0 })
  storageUsed: number; // Consumo atual em bytes

  // Referência ao usuário proprietário/administrador da organização
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  // Status da organização para controle de pagamento futuro
  @Prop({
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  })
  status: string;

  @Prop({ type: OrganizationSettings, default: {} })
  settings: OrganizationSettings;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.index({ name: 'text' });
