//src/projects/services/timeline.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { TimelineEvent, TimelineEventDocument, TimelineEventType } from '../schemas/timeline-event.schema';

@Injectable()
export class TimelineService {
  constructor(
    @InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEventDocument>
  ) {}

  // OUVINTE CENTRAL DA TIMELINE
  @OnEvent('timeline.create')
  async handleTimelineEvent(payload: {
    orgId: string;
    projectId: string;
    authorId: string;
    type: TimelineEventType;
    description: string;
    metadata?: any;
  }) {
    try {
      const event = new this.timelineEventModel({
        organizationId: new Types.ObjectId(payload.orgId),
        projectId: new Types.ObjectId(payload.projectId),
        authorId: new Types.ObjectId(payload.authorId),
        type: payload.type,
        description: payload.description,
        metadata: payload.metadata,
      });
      await event.save();
    } catch (error) {
      console.error('[Timeline] Erro ao salvar evento centralizado:', error);
    }
  }

  // BUSCA A TIMELINE DA ORGANIZAÇÃO (Dashboard)
  async getOrganizationTimeline(orgId: string) {
    return this.timelineEventModel
      .find({ organizationId: new Types.ObjectId(String(orgId)) })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('authorId', 'name avatarUrl')
      .populate('projectId', 'title referenceCode')
      .exec();
  }
}