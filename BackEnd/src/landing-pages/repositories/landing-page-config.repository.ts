//src/landing-pages/repositories/landing-page-config.repository.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LandingPageConfig } from '../schemas/landing-page-config.schema';

@Injectable()
export class LandingPageConfigRepository {
  constructor(
    @InjectModel(LandingPageConfig.name)
    private readonly configModel: Model<LandingPageConfig>,
  ) {}

  // Acesso Público: Retorna apenas se a landing page estiver ativa.
  // Tenta o domínio exato e, como fallback, a variante sem o prefixo "www.".
  async findByDomain(domain: string): Promise<LandingPageConfig | null> {
    const normalized = domain.trim().toLowerCase();
    const candidates = normalized.startsWith('www.')
      ? [normalized, normalized.replace(/^www\./, '')]
      : [normalized, `www.${normalized}`];

    return this.configModel
      .findOne({ domain: { $in: candidates }, isActive: true })
      .exec();
  }

  // Acesso Privado: Retorna o documento independentemente do status para edição no Dashboard
  async findByOrganizationId(
    organizationId: Types.ObjectId,
  ): Promise<LandingPageConfig | null> {
    return this.configModel.findOne({ organizationId }).exec();
  }

  // Validação: Domínio é globalmente único no sistema (mesmo que a landing esteja inativa),
  // evitando reivindicação cruzada e corridas de upsert (E11000).
  async findConflictingDomain(
    domain: string,
    organizationId: Types.ObjectId,
  ): Promise<LandingPageConfig | null> {
    if (!domain) {
      return null;
    }
    return this.configModel
      .findOne({
        domain,
        organizationId: { $ne: organizationId },
      })
      .exec();
  }

  // Mutação: Atualiza ou cria o registro da organização
  async upsert(
    organizationId: Types.ObjectId,
    data: Partial<LandingPageConfig>,
  ): Promise<LandingPageConfig> {
    try {
      return await this.configModel
        .findOneAndUpdate(
          { organizationId },
          { $set: data },
          { new: true, upsert: true },
        )
        .exec();
    } catch (error: any) {
      // Corrida entre requisições simultâneas: o index unique do domínio impede o conflito
      if (error?.code === 11000) {
        throw new ConflictException(
          'Este domínio já está em uso por outra organização.',
        );
      }
      throw error;
    }
  }

  // Deleção Lógica: Desativa a página pública
  async softDelete(organizationId: Types.ObjectId): Promise<void> {
    await this.configModel
      .updateOne({ organizationId }, { $set: { isActive: false } })
      .exec();
  }
}
