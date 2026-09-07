// src/landing-pages/services/landing-page-config.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { LandingPageConfigRepository } from '../repositories/landing-page-config.repository';
import { UpsertLandingPageDTO } from '../validations/landing-page.zod';
import { LandingPageConfig } from '../schemas/landing-page-config.schema';
import { OrganizationService } from '../../organization/services/organization.service';

@Injectable()
export class LandingPageConfigService {
  constructor(
    private readonly repository: LandingPageConfigRepository,
    private readonly organizationService: OrganizationService,
  ) { }

  // Acesso Público: Rota consumida pelo Front-end Next.js (via Custom Domain)
  async getPublicConfigByDomain(domain: string) {
    const config = await this.repository.findByDomain(domain);

    if (!config || !config.isActive) {
      throw new NotFoundException(`Configuração não encontrada ou inativa para o domínio: ${domain}`);
    }

    // Correção: Instancia o ObjectId para satisfazer a assinatura de OrganizationService.findById
    const orgId = new Types.ObjectId(config.organizationId.toString());
    const org = await this.organizationService.findById(orgId);

    return { config, org };
  }

  // Acesso Público: Rota consumida pelo Front-end Next.js (via Subdomínio Cazuá)
  async getPublicConfigBySlug(slug: string) {
    const org = await this.organizationService.findOneBySlug(slug);

    if (!org) {
      throw new NotFoundException(`Organização não encontrada para o slug: ${slug}`);
    }

    // Correção: Garante a extração e conversão do _id em ObjectId
    const orgId = new Types.ObjectId(org._id.toString());
    const config = await this.repository.findByOrganizationId(orgId);

    if (!config || !config.isActive) {
      throw new NotFoundException(`Configuração não encontrada ou inativa para o slug: ${slug}`);
    }

    return { config, org };
  }

  // Acesso Privado: Rota consumida pelo Dashboard do Cazuá
  async getConfigByOrgId(orgIdString: string) {
    const organizationId = new Types.ObjectId(orgIdString);
    const config = await this.repository.findByOrganizationId(organizationId);

    if (!config) {
      throw new NotFoundException('Configuração de Landing Page não encontrada para esta organização.');
    }
    return config;
  }

  // Mutação Privada: Rota consumida pelo Dashboard do Cazuá
  async upsertConfig(orgIdString: string, data: UpsertLandingPageDTO) {
    const organizationId = new Types.ObjectId(orgIdString);
    const domain = data.domain?.trim().toLowerCase();

    if (domain) {
      const conflict = await this.repository.findConflictingDomain(domain, organizationId);
      if (conflict) {
        throw new ConflictException('Este domínio já está em uso por outra organização.');
      }
    }

    return this.repository.upsert(organizationId, {
      ...data,
      domain: domain || null,
    } as unknown as Partial<LandingPageConfig>);
  }

  // Deleção Lógica: Desativa a página pública da organização
  async disableConfig(orgIdString: string) {
    const organizationId = new Types.ObjectId(orgIdString);
    await this.repository.softDelete(organizationId);
  }
}