//src/landing-pages/controllers/landing-page-config.controller.ts
import { Controller, Get, Patch, Body, Req, UseGuards, UsePipes } from '@nestjs/common';
import { Request } from 'express';
import { LandingPageConfigService } from '../services/landing-page-config.service';
import { upsertLandingPageSchema, UpsertLandingPageDTO } from '../validations/landing-page.zod';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { TenantGuard } from '../../organization/guards/tenant.guard';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';

interface TenantRequest extends Request {
  user: any;
  organizationId: string;
  userRole: string;
}

@UseGuards(AuthGuard, TenantGuard)
@Controller('landing-pages')
export class LandingPageConfigController {
  constructor(private readonly service: LandingPageConfigService) {}

  @Get('me')
  async getMyConfig(@Req() req: TenantRequest) {
    return this.service.getConfigByOrgId(req.organizationId);
  }

  @Patch('me')
  @UsePipes(new ZodValidationPipe(upsertLandingPageSchema))
  async upsertMyConfig(@Req() req: TenantRequest, @Body() body: UpsertLandingPageDTO) {
    return this.service.upsertConfig(req.organizationId, body);
  }
}