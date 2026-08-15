//src/modules/landing-page/landing-page-config.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { LandingPageConfigService } from '../landing-page-config.service';

@Controller('landing-pages')
export class LandingPageConfigController {
  constructor(private readonly service: LandingPageConfigService) {}

  @Get(':domain')
  async getByDomain(@Param('domain') domain: string) {
    return this.service.getConfigByDomain(domain);
  }
  
}