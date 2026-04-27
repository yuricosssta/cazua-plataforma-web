//src/resources/resources.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResourcesController } from './controllers/resources.controller';
import { ResourcesService } from './services/resources.service';
import { ResourceRepository } from './repositories/resource.repository';
import { ResourceTransactionRepository } from './repositories/resource-transaction.repository';
import { Resource, ResourceSchema } from './schemas/resource.schema';
import { ResourceTransaction, ResourceTransactionSchema } from './schemas/resource-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
      { name: ResourceTransaction.name, schema: ResourceTransactionSchema },
    ])
  ],
  controllers: [ResourcesController],
  providers: [
    ResourcesService,
    ResourceRepository,            
    ResourceTransactionRepository  
  ],
  exports: [ResourcesService],
})
export class ResourcesModule {}
