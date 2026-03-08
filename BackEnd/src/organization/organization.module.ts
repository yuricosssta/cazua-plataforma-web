import { Module } from '@nestjs/common';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationService } from './services/organization.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationSchema } from './schemas/organization.schema';
import { OrganizationMemberSchema } from './schemas/organization-member.schema';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Organization', schema: OrganizationSchema },
      { name: 'OrganizationMember', schema: OrganizationMemberSchema },
    ]),
    UsersModule,
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [
    OrganizationService,
    MongooseModule,
  ],
})
export class OrganizationModule { }
