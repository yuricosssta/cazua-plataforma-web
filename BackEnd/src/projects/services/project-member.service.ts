import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { TimelineEventType } from '../schemas/timeline-event.schema';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private eventEmitter: EventEmitter2
  ) {}

  // ALOCAÇÃO DE EQUIPE
  async assignMember(orgId: string, projectId: string, memberId: string, actionByUserId: string, memberName: string) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(String(projectId)),
        organizationId: new Types.ObjectId(String(orgId))
      },
      { $addToSet: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    ).exec();

    if (!project) throw new NotFoundException('Projeto não encontrado nesta organização.');

    this.eventEmitter.emit('timeline.create', {
      orgId: orgId,
      projectId: String(project._id),
      authorId: actionByUserId,
      type: TimelineEventType.STATUS_CHANGE,
      description: `Membro ${memberName} foi adicionado à equipe da obra.`,
    });

    return project;
  }

  // DESALOCAÇÃO DE EQUIPE
  async removeMember(orgId: string, projectId: string, memberId: string, actionByUserId: string, memberName: string) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(String(projectId)),
        organizationId: new Types.ObjectId(String(orgId))
      },
      { $pull: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    ).exec();

    if (!project) throw new NotFoundException('Projeto não encontrado nesta organização.');

    this.eventEmitter.emit('timeline.create', {
      orgId: orgId,
      projectId: String(project._id),
      authorId: actionByUserId,
      type: TimelineEventType.STATUS_CHANGE,
      description: `Membro ${memberName} foi removido da equipe da obra.`,
    });

    return project;
  }
}