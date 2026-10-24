import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiClient, ApiClientSchema } from './schemas/api-client.schema';
import { API_CLIENT_REPOSITORY } from './repositories/api-client.repository';
import { ApiClientMongooseRepository } from './repositories/mongoose/api-client.mongoose.repository';
import { ApiClientService } from './services/api-client.service';
import { ApiClientController } from './controllers/api-client.controller';
import { ApiClientGuard } from './guards/api-client.guard';
import { OptionalApiClientGuard } from './guards/optional-api-client.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiClient.name, schema: ApiClientSchema },
    ]),
  ],
  controllers: [ApiClientController],
  providers: [
    {
      provide: API_CLIENT_REPOSITORY,
      useClass: ApiClientMongooseRepository,
    },
    ApiClientService,
    ApiClientGuard,
    OptionalApiClientGuard,
    SuperAdminGuard,
  ],
  exports: [ApiClientService, ApiClientGuard, OptionalApiClientGuard],
})
export class ApiClientModule {}
