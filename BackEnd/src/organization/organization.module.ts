import { Module } from '@nestjs/common';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationService } from './services/organization.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationSchema } from './schemas/organization.schema';
import { OrganizationMemberSchema } from './schemas/organization-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Organization', schema: OrganizationSchema },
      { name: 'OrganizationMember', schema: OrganizationMemberSchema },
    ]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [
    OrganizationService, // Útil se outros módulos precisarem usar o Service
    MongooseModule,       // CRUCIAL: Exporta os Models (OrganizationMember) para fora
  ],
})
export class OrganizationModule { }
