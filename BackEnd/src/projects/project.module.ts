// BackEnd/src/projects/projects.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './services/project.service';
import { ProjectsController } from './controllers/project.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { TimelineEvent, TimelineEventSchema } from './schemas/timeline-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: TimelineEvent.name, schema: TimelineEventSchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {} 