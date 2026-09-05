//src/landing-pages/controllers/public-landing-page.controller.ts
import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Types } from 'mongoose';
import { LandingPageConfigService } from '../services/landing-page-config.service';
import { OrganizationService } from '../../organization/services/organization.service';

// Rota pública: retorna dados de personalização para a página de login do tenant
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

    const org = await this.organizationService.findById(
      new Types.ObjectId(config.organizationId),
    );

    return this.buildPublicDTO(config, org);
  }

  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const config = await this.service.getConfigBySlug(slug);

    const org = await this.organizationService.findOneBySlug(slug);

    return this.buildPublicDTO(config, org);
  }

  private buildPublicDTO(config: any, org: any) {
    return {
      organizationId: config.organizationId.toString(),
      isActive: config.isActive,
      name: org?.name ?? config.name,
      organizationSettings: {
        logoUrl: org?.settings?.logoUrl ?? null,
        primaryColorHex: org?.settings?.primaryColorHex ?? '#000000',
      },
    };
  }
}
