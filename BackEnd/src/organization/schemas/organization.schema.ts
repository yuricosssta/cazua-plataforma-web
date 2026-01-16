import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema'; // Ajuste o caminho conforme sua estrutura

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ 
  timestamps: true, // Cria automaticamente createdAt e updatedAt
  collection: 'organizations' 
})
export class Organization {
  
  // O nome de exibição (ex: "Construtora Silva & Filhos")
  @Prop({ required: true, trim: true })
  name: string;

  // O identificador único na URL (ex: "construtora-silva")
  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

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

  // (Opcional) Um campo flexível para configurações futuras (cor, logo, timezone)
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

OrganizationSchema.index({ name: 'text' });
