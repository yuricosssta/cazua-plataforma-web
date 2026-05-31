import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { PlanningSchema, Planning } from './schemas/planning.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Planning.name, schema: PlanningSchema }]),
  ],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
