//src/landing-pages/controllers/public-landing-page.controller.ts
import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LandingPageConfigService } from '../services/landing-page-config.service';
import { OrganizationService } from '../../organization/services/organization.service';

// Rota pública: renderiza a landing page multi-tenant sem autenticação
@UseGuards(ThrottlerGuard)
@Controller('public/landing-pages')
export class PublicLandingPageController {
  constructor(
    private readonly service: LandingPageConfigService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Get(':domain')
  async getByDomain(@Param('domain') domain: string) {
    const config = await this.service.getConfigByDomain(domain);

    if (!config.isActive) {
      throw new NotFoundException(
        `Configuração não encontrada para o domínio: ${domain}`,
      );
    }

    const org = await this.organizationService.findOneBySlug(
      config.domain || '',
    );
    const organizationLogoUrl = org?.settings?.logoUrl ?? config.logoUrl;

    // DTO público: expõe somente os campos necessários ao site, sem campos internos
    return {
      organizationId: config.organizationId.toString(),
      domain: config.domain,
      name: config.name,
      logoUrl: config.logoUrl,
      organizationLogoUrl,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      contentMDX: config.contentMDX,
      theme: config.theme,
      isActive: config.isActive,
    };
  }

  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const config = await this.service.getConfigBySlug(slug);

    const org = await this.organizationService.findOneBySlug(slug);
    const organizationLogoUrl = org?.settings?.logoUrl ?? config.logoUrl;

    // DTO público idêntico ao getByDomain
    return {
      organizationId: config.organizationId.toString(),
      domain: config.domain,
      name: config.name,
      logoUrl: config.logoUrl,
      organizationLogoUrl,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      contentMDX: config.contentMDX,
      theme: config.theme,
      isActive: config.isActive,
    };
  }
}
