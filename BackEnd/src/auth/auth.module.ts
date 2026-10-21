import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthUsersService } from './services/auth-users.service';
import { AuthUsersRepository } from './repositories/auth-users.repository';
import { UsersModule } from '../users/user.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OrganizationModule } from '../organization/organization.module';
import { ApiClientModule } from '../api-clients/api-client.module';
import { AuthGuard } from './guards/auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => ApiClientModule),
    OrganizationModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthUsersService,
    AuthUsersRepository,
    AuthGuard,
    SuperAdminGuard,
  ],
  exports: [AuthService, AuthGuard, SuperAdminGuard],
})
export class AuthModule {}
