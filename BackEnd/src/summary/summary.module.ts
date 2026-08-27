import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SummaryController } from './summary.controller';
import SummaryService from './summary.service';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from 'src/organization/organization.module';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Reels, ReelsSchema } from './schemas/reel.schema';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: Reels.name,
        schema: ReelsSchema,
      },
    ]),
    AuthModule,
    OrganizationModule,
  ],
  controllers: [SummaryController],
  providers: [SummaryService],
})
export class SummaryModule {}
