// BackEnd/src/projects/services/project.service.ts

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectStatus } from '../schemas/project.schema';
import { TimelineEvent, TimelineEventDocument, TimelineEventType } from '../schemas/timeline-event.schema';
import { CreateProjectDto, EmitParecerDto } from '../validations/project.zod';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEventDocument>,
  ) {}

  // Calcula a pontuação final multiplicando os valores (ex: 5 x 4 x 2 = 40)
  private calculatePriorityScore(details: Record<string, number>): number {
    const values = Object.values(details);
    if (values.length === 0) return 0;
    return values.reduce((acc, curr) => acc * curr, 1);
  }

  // 1. CRIAÇÃO DA DEMANDA INICIAL
  async createProject(orgId: string, userId: string, data: CreateProjectDto) {
    try {
      // Cria a Obra (Nasce sem prioridade definida)
      const newProject = new this.projectModel({
        organizationId: new Types.ObjectId(String(orgId)),
        createdBy: new Types.ObjectId(String(userId)),
        title: data.title,
        location: data.location,
        status: data.status as ProjectStatus,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });

      const savedProject = await newProject.save();

      // Regista o nascimento na Timeline
      const firstEvent = new this.timelineEventModel({
        projectId: savedProject._id,
        organizationId: new Types.ObjectId(String(orgId)),
        authorId: new Types.ObjectId(String(userId)),
        type: TimelineEventType.STATUS_CHANGE,
        description: 'Registro inicial de demanda criado no sistema.',
        metadata: { newStatus: savedProject.status }
      });

      const savedEvent = await firstEvent.save();

      // Denormalização para performance
      savedProject.lastEventId = savedEvent._id as any;
      await savedProject.save();

      return savedProject;
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      throw new InternalServerErrorException('Falha estrutural ao registrar a demanda.');
    }
  }

  // 2. EMISSÃO DO PARECER TÉCNICO E DEFINIÇÃO DE PRIORIDADE
  async emitParecerTecnico(orgId: string, projectId: string, userId: string, data: EmitParecerDto) {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(String(projectId)),
      organizationId: new Types.ObjectId(String(orgId))
    });

    if (!project) {
      throw new NotFoundException('Demanda/Projeto não encontrada.');
    }

    // Calcula o score máximo de 125 baseado nas respostas
    const score = this.calculatePriorityScore(data.priorityDetails);

    try {
      // Atualiza a Obra com os novos dados de prioridade e possivelmente novo status
      project.priorityScore = score;
      project.priorityDetails = data.priorityDetails;
      
      let statusChanged = false;
      if (data.newStatus && data.newStatus !== project.status) {
        project.status = data.newStatus as ProjectStatus;
        statusChanged = true;
      }

      // Regista o Parecer na Timeline
      const parecerEvent = new this.timelineEventModel({
        projectId: project._id,
        organizationId: new Types.ObjectId(String(orgId)),
        authorId: new Types.ObjectId(String(userId)),
        type: TimelineEventType.COMMENT,
        description: data.parecerText,
        metadata: {
          priorityScore: score,
          priorityDetails: data.priorityDetails,
          statusChanged: statusChanged ? project.status : null
        }
      });

      const savedEvent = await parecerEvent.save();

      // Atualiza o projeto com o ID do último evento para a listagem rápida
      project.lastEventId = savedEvent._id as any;
      await project.save();

      return project;
    } catch (error) {
      console.error('Erro ao emitir parecer:', error);
      throw new InternalServerErrorException('Falha ao registrar o parecer técnico.');
    }
  }

  // 3. LISTAGEM RÁPIDA (Ordenada por prioridade e data)
  async findAllByOrganization(orgId: string) {
    return this.projectModel
      .find({ organizationId: new Types.ObjectId(String(orgId)) })
      .populate({
        path: 'lastEventId', 
        select: 'description date authorId type metadata',
      })
      // Ordenação primária pela Prioridade (do mais crítico para o menor), secundária pela criação
      .sort({ priorityScore: -1, createdAt: -1 }) 
      .exec();
  }
}