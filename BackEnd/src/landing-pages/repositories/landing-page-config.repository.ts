//src/landing-pages/repositories/landing-page-config.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LandingPageConfig } from '../schemas/landing-page-config.schema';

@Injectable()
export class LandingPageConfigRepository {
  constructor(
    @InjectModel(LandingPageConfig.name)
    private readonly configModel: Model<LandingPageConfig>,
  ) {}

  // Acesso Público: Retorna apenas se a landing page estiver ativa
  async findByDomain(domain: string): Promise<LandingPageConfig | null> {
    return this.configModel.findOne({ domain, isActive: true }).exec();
  }

  // Acesso Privado: Retorna o documento independentemente do status para edição no Dashboard
  async findByOrganizationId(organizationId: Types.ObjectId): Promise<LandingPageConfig | null> {
    return this.configModel.findOne({ organizationId }).exec();
  }

  // Validação: Garante que outro tenant não esteja usando o mesmo domínio ativamente
  async findConflictingDomain(domain: string, organizationId: Types.ObjectId): Promise<LandingPageConfig | null> {
    return this.configModel.findOne({
      domain,
      organizationId: { $ne: organizationId },
      isActive: true,
    }).exec();
  }

  // Mutação: Atualiza ou cria o registro da organização
  async upsert(organizationId: Types.ObjectId, data: Partial<LandingPageConfig>): Promise<LandingPageConfig> {
    return this.configModel.findOneAndUpdate(
      { organizationId },
      { $set: data },
      { new: true, upsert: true }
    ).exec();
  }

  // Deleção Lógica: Desativa a página pública
  async softDelete(organizationId: Types.ObjectId): Promise<void> {
    await this.configModel.updateOne(
      { organizationId },
      { $set: { isActive: false } }
    ).exec();
  }
}