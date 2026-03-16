// BackEnd/src/projects/services/project.service.ts

import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  ) { }

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

  // 2. EMISSÃO DO PARECER TÉCNICO E DEFINIÇÃO DE PRIORIDADE (COM GUT OPCIONAL)
  async emitParecerTecnico(orgId: string, projectId: string, userId: string, data: EmitParecerDto, userRole?: string) {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(String(projectId)),
      organizationId: new Types.ObjectId(String(orgId))
    });

    if (!project) {
      throw new NotFoundException('Demanda/Projeto não encontrada.');
    }

    const isAssigned = project.assignedMembers.some(memberId => memberId.toString() === userId.toString());
    const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN';

    if (!isAssigned && !isAdmin) {
      throw new ForbiddenException('Acesso negado: Você não tem permissão para emitir pareceres neste projeto.');
    }

    // Gerar um código de referência único para este parecer
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const milliseconds = String(new Date().getTime()).slice(-4);
    // const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceCode = `${year}${month}${day}-${milliseconds}`;

    try {
      // Verifica e atualiza o Status (se foi enviado um novo)
      let statusChanged = false;
      if (data.newStatus && data.newStatus !== project.status) {
        project.status = data.newStatus as ProjectStatus;
        statusChanged = true;
      }

      // Base dos metadados da Timeline
      const metadata: any = {
        statusChanged: statusChanged ? project.status : null
      };

      // Só recalcula e atualiza o banco se o Front-end mandou os dados da matriz
      if (data.priorityDetails && Object.keys(data.priorityDetails).length > 0) {
        const score = this.calculatePriorityScore(data.priorityDetails);
        project.priorityScore = score;
        project.priorityDetails = data.priorityDetails;
        
        // Injeta a nota no metadado para a Timeline saber que a nota mudou neste evento
        metadata.priorityScore = score;
        metadata.priorityDetails = data.priorityDetails;
      }

      // Regista o Parecer na Timeline
      const parecerEvent = new this.timelineEventModel({
        projectId: project._id,
        organizationId: new Types.ObjectId(String(orgId)),
        authorId: new Types.ObjectId(String(userId)),
        type: TimelineEventType.COMMENT,
        description: data.parecerText,
        referenceCode: referenceCode,
        metadata: metadata // Salva os metadados dinâmicos construídos acima
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

  // 4. VISÃO DE DETALHE (Traz a Obra e a Timeline completa)
  async findOneWithTimeline(orgId: string, projectId: string) {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(String(projectId)),
      organizationId: new Types.ObjectId(String(orgId))
    }).exec();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado.');
    }
    // Busca TODOS os eventos dessa obra, ordenados do mais recente para o mais antigo
    const timeline = await this.timelineEventModel.find({
      projectId: new Types.ObjectId(String(projectId)),
      organizationId: new Types.ObjectId(String(orgId))
    })
    .populate('authorId', 'name')
    .sort({ createdAt: -1 })
    .exec();

    return { project, timeline };
  }

  // 5. ALOCAÇÃO DE EQUIPE
  async assignMember(orgId: string, projectId: string, memberId: string) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(String(projectId)),
        organizationId: new Types.ObjectId(String(orgId))
      },
      // $addToSet adiciona o ID apenas se ele já não estiver na lista (evita duplicidade)
      { $addToSet: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    ).exec();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado nesta organização.');
    }

    // Registrar isso na Timeline como evento de sistema!
    const timelineEvent = new this.timelineEventModel({
      projectId: project._id,
      organizationId: new Types.ObjectId(String(orgId)),
      authorId: new Types.ObjectId(String(memberId)),
      type: 'STATUS_CHANGE', 
      description: 'Novo membro alocado à equipe.',
    });
    await timelineEvent.save();

    return project;
  }

  // 6. DESALOCAÇÃO DE EQUIPE
  async removeMember(orgId: string, projectId: string, memberId: string) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(String(projectId)),
        organizationId: new Types.ObjectId(String(orgId))
      },
      // $pull arranca o ID de dentro do array
      { $pull: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    ).exec();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado nesta organização.');
    }

    // Registrar isso na Timeline como evento de sistema!
    const timelineEvent = new this.timelineEventModel({
      projectId: project._id,
      organizationId: new Types.ObjectId(String(orgId)),
      authorId: new Types.ObjectId(String(memberId)),
      type: 'STATUS_CHANGE', 
      description: 'Membro removido da equipe.',
    });
    await timelineEvent.save();

    return project;
  }

}