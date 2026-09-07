// src/landing-pages/controllers/public-landing-page.controller.ts
import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LandingPageConfigService } from '../services/landing-page-config.service';

@UseGuards(ThrottlerGuard)
@Controller('public/landing-pages')
export class PublicLandingPageController {
  constructor(private readonly service: LandingPageConfigService) {}

  @Get(':domain')
  async getByDomain(@Param('domain') domain: string) {
    const { config, org } = await this.service.getPublicConfigByDomain(domain);
    return this.buildPublicDTO(config, org);
  }

  @Get('by-slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    const { config, org } = await this.service.getPublicConfigBySlug(slug);
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