import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Organization } from './organization.schema';

export type OrganizationMemberDocument = HydratedDocument<OrganizationMember>;

@Schema({ 
  timestamps: true,
  collection: 'organization_members' 
})
export class OrganizationMember {
  
  // Vínculo com a Organização
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  // Vínculo com o Usuário
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // O "Cargo" neste contexto específico
  @Prop({ 
    type: String, 
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'], 
    default: 'MEMBER',
    required: true
  })
  role: string;
}

export const OrganizationMemberSchema = SchemaFactory.createForClass(OrganizationMember);

// Impede que o mesmo usuário seja adicionado 2x na mesma empresa.
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });