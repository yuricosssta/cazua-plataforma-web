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

// Rota pública: renderiza a landing page multi-tenant sem autenticação
@UseGuards(ThrottlerGuard)
@Controller('public/landing-pages')
export class PublicLandingPageController {
  constructor(private readonly service: LandingPageConfigService) {}

  @Get(':domain')
  async getByDomain(@Param('domain') domain: string) {
    const config = await this.service.getConfigByDomain(domain);

    if (!config.isActive) {
      throw new NotFoundException(
        `Configuração não encontrada para o domínio: ${domain}`,
      );
    }

    // DTO público: expõe somente os campos necessários ao site, sem campos internos
    return {
      tenantId: config.organizationId.toString(),
      domain: config.domain,
      name: config.name,
      logoUrl: config.logoUrl,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      contentMDX: config.contentMDX,
      theme: config.theme,
      isActive: config.isActive,
    };
  }
}
