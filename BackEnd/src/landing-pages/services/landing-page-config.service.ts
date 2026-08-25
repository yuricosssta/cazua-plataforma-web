//src/landing-pages/services/landing-page-config.service.ts
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
  ) {}

  // Acesso Público: Rota consumida pelo Front-end Next.js para renderizar a Landing Page
  async getConfigByDomain(domain: string) {
    const config = await this.repository.findByDomain(domain);
    if (!config) {
      throw new NotFoundException(
        `Configuração não encontrada para o domínio: ${domain}`,
      );
    }
    return config;
  }
  // Acesso Privado: Rota consumida pelo Dashboard do Cazuá (GET /landing-pages/me)
  async getConfigByOrgId(orgIdString: string) {
    const organizationId = new Types.ObjectId(orgIdString);
    const config = await this.repository.findByOrganizationId(organizationId);

    if (!config) {
      throw new NotFoundException(
        'Configuração de Landing Page não encontrada para esta organização.',
      );
    }
    return config;
  }

  // Mutação Privada: Rota consumida pelo Dashboard do Cazuá (PATCH /landing-pages/me)
  async upsertConfig(orgIdString: string, data: UpsertLandingPageDTO) {
    const organizationId = new Types.ObjectId(orgIdString);
    const domain = data.domain.trim().toLowerCase();

    // Impede que a organização atual assuma um domínio já registrado por terceiros
    // (política: domínio globalmente único, mesmo se a landing estiver inativa)
    const conflict = await this.repository.findConflictingDomain(
      domain,
      organizationId,
    );
    if (conflict) {
      throw new ConflictException(
        'Este domínio já está em uso por outra organização.',
      );
    }

    // Type assertion bypassa a incompatibilidade shallow do Partial<T> com objetos aninhados do Zod
    return this.repository.upsert(organizationId, {
      ...data,
      domain,
    } as unknown as Partial<LandingPageConfig>);
  }

  // Deleção Lógica: Desativa a página pública da organização
  async disableConfig(orgIdString: string) {
    const organizationId = new Types.ObjectId(orgIdString);
    await this.repository.softDelete(organizationId);
  }

  // Acesso Público via Slug: Usado pelo Cloudflare Worker para subdomínios Cazuá
  async getConfigBySlug(slug: string) {
    const org = await this.organizationService.findOneBySlug(slug);
    if (!org) {
      throw new NotFoundException(
        `Organização não encontrada para o slug: ${slug}`,
      );
    }
    const config = await this.repository.findByOrganizationId(org._id);
    if (!config || !config.isActive) {
      throw new NotFoundException(
        `Configuração não encontrada ou inativa para o slug: ${slug}`,
      );
    }
    return config;
  }
}
