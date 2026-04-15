//src/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { StorageController } from './controllers/storage.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from '../organization/schemas/organization.schema';
import { FileAsset, FileAssetSchema } from './schemas/file-asset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: FileAsset.name, schema: FileAssetSchema },
    ]),
  ],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}