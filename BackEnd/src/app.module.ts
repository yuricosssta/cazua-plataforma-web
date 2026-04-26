import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostModule } from './posts/post.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { SummaryModule } from './summary/summary.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectsModule } from './projects/project.module';
import { StorageModule } from './storage/storage.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),
    EventEmitterModule.forRoot(),
    UsersModule,
    AuthModule,
    PostModule,
    TranscriptionModule,
    SummaryModule,
    OrganizationModule,
    ProjectsModule,
    StorageModule,
    ResourcesModule, 
  ],
  controllers: [AppController],
  providers: [AppService],// { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}