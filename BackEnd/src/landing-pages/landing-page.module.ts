import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LandingPageConfigController } from '../landing-pages/controllers/landing-page-config.controller';
import { PublicLandingPageController } from './controllers/public-landing-page.controller';
import { LandingPageConfigService } from './services/landing-page-config.service';
import { LandingPageConfigRepository } from './repositories/landing-page-config.repository';
import { LeadRepository } from './repositories/lead.repository';
import {
  LandingPageConfig,
  LandingPageConfigSchema,
} from './schemas/landing-page-config.schema';
import { LeadController } from './controllers/lead.controller';
import { Lead, LeadSchema } from './schemas/lead.schema';
import { LeadService } from './services/lead.service';
import { LandingPageRoleGuard } from './guards/landing-page-role.guard';
import { OrganizationModule } from 'src/organization/organization.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandingPageConfig.name, schema: LandingPageConfigSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
    OrganizationModule,
  ],
  controllers: [
    LandingPageConfigController,
    LeadController,
    PublicLandingPageController,
  ],
  providers: [
    LandingPageConfigService,
    LandingPageConfigRepository,
    LeadService,
    LeadRepository,
    LandingPageRoleGuard,
  ],
  exports: [LandingPageConfigService, LeadService],
})
export class LandingPageModule {}
