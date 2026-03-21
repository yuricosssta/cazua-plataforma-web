// BackEnd/src/projects/services/project.service.ts

import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectStatus } from '../schemas/project.schema';
import { TimelineEvent, TimelineEventDocument, TimelineEventType } from '../schemas/timeline-event.schema';
import { CreateProjectDto, EmitParecerDto } from '../validations/project.zod';
import { Counter, CounterDocument } from '../schemas/counter.schema';
import { Organization, OrganizationDocument } from '../../organization/schemas/organization.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEventDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
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
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      const org = await this.orgModel.findById(orgId).exec();
      let prefixoOrg = 'CAZ'; // Fallback de segurança
      if (org) {
        if (org.acronym) {
          prefixoOrg = org.acronym;
        } else if (org.name) {
          // Fallback para organizações antigas criadas antes dessa atualização
          prefixoOrg = org.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        }
      }

      const counterId = `DEMAND_${orgId}_${year}${month}`;
      const counter = await this.counterModel.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } }, // Incrementa +1 de forma bloqueante (atômica)
        { new: true, upsert: true } // Se não existir, cria começando no 1
      );

      // MONTAGEM DO CÓDIGO: [Org].[AnoMês].[000X]
      const sequencia = String(counter.seq).padStart(4, '0');
      const referenceCode = `${prefixoOrg}.${year}${month}.${sequencia}`;
      
      // Cria a demanda com o código gerado
      const newProject = new this.projectModel({
        organizationId: new Types.ObjectId(String(orgId)),
        createdBy: new Types.ObjectId(String(userId)),
        referenceCode: referenceCode,
        title: data.title,
        description: data.description,
        location: data.location,
        status: data.status as ProjectStatus,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        attachments: data.attachments || [],
      });

      const savedProject = await newProject.save();

      // Regista o nascimento na Timeline (AGORA COMO UM DOCUMENTO OFICIAL)
      const firstEvent = new this.timelineEventModel({
        projectId: savedProject._id,
        organizationId: new Types.ObjectId(String(orgId)),
        authorId: new Types.ObjectId(String(userId)),
        type: TimelineEventType.DOCUMENT, // CORREÇÃO: Usando a enumeração oficial
        description: data.description, // O corpo do documento é a descrição real
        referenceCode: referenceCode,
        metadata: { 
          newStatus: savedProject.status,
          isInitialDemand: true, // Tag para identificar que é a abertura
          attachments: data.attachments || [] 
        }
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

    const isAssigned = project.assignedMembers?.some(memberId => memberId.toString() === userId.toString()) || false;
    const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
    // Nova trava: Verifica se o usuário logado foi quem criou a demanda
    const isCreator = project.createdBy && project.createdBy.toString() === userId.toString();

    if (!isAssigned && !isAdmin && !isCreator) {
      throw new ForbiddenException('Acesso negado: Você não tem permissão para emitir pareceres neste projeto.');
    }

    // Gerar um código de referência único para este parecer
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const milliseconds = String(new Date().getTime()).slice(-4);
    const referenceCode = `${year}${month}${day}-${milliseconds}`;

    try {
      // Verifica e atualiza o Status (se foi enviado um novo)
      let statusChanged = false;
      if (data.newStatus && data.newStatus !== project.status) {
        project.status = data.newStatus as ProjectStatus;
        statusChanged = true;
      }

      if (data.technicalTitle) project.title = data.technicalTitle;
      if (data.startDate) project.startDate = new Date(data.startDate);
      if (data.endDate) project.endDate = new Date(data.endDate);
      if (data.location) project.location = data.location;

      // Base dos metadados da Timeline
      const metadata: any = {
        statusChanged: statusChanged ? project.status : null
      };

      // Só recalcula e atualiza o banco se o Front-end mandou os dados da matriz
      if (data.priorityDetails && Object.keys(data.priorityDetails).length > 0) {
        const score = this.calculatePriorityScore(data.priorityDetails);
        project.priorityScore = score;
        project.priorityDetails = data.priorityDetails;
        
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
        metadata: metadata 
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
        select: 'description date authorId type metadata createdAt',
        populate: { path: 'authorId', select: 'name' } 
      })
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
      { $addToSet: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    ).exec();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado nesta organização.');
    }

    const timelineEvent = new this.timelineEventModel({
      projectId: project._id,
      organizationId: new Types.ObjectId(String(orgId)),
      authorId: new Types.ObjectId(String(memberId)),
      type: TimelineEventType.STATUS_CHANGE, // CORREÇÃO: Usando a enumeração oficial
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
      { $pull: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    ).exec();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado nesta organização.');
    }

    const timelineEvent = new this.timelineEventModel({
      projectId: project._id,
      organizationId: new Types.ObjectId(String(orgId)),
      authorId: new Types.ObjectId(String(memberId)),
      type: TimelineEventType.STATUS_CHANGE, 
      description: 'Membro removido da equipe.',
    });
    await timelineEvent.save();

    return project;
  }

}