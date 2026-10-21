import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './services/user.service';
import { UsersMongooseRepository } from './repositories/mongoose/user.mongoose.repository';
import { UsersRepository } from './repositories/user.repository';
import { UsersController } from './controllers/user.controller';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from 'src/shared/shared.module';
import { ApiClientModule } from '../api-clients/api-client.module';
import { SelfOrSuperAdminGuard } from './guards/self-or-super-admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => ApiClientModule),
    SharedModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    SelfOrSuperAdminGuard,
    {
      provide: UsersRepository,
      useClass: UsersMongooseRepository,
    },
  ],
  exports: [UsersService, UsersRepository, SelfOrSuperAdminGuard],
})
export class UsersModule {}
