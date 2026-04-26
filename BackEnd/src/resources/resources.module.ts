import { Module } from '@nestjs/common';
import { ResourcesController } from './controllers/resources.controller';
import { ResourcesService } from './services/resources.service';
import { ResourceTransactionRepository } from './repositories/resource-transaction.repository';
import { ResourceRepository } from './repositories/resource.repository';

@Module({
  controllers: [ResourcesController],
  providers: [ResourcesService, ResourceRepository, ResourceTransactionRepository],
})
export class ResourcesModule {}
