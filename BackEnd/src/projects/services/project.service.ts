// BackEnd/src/projects/services/project.service.ts

import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException, HttpException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument, ProjectStatus } from '../schemas/project.schema';
import { TimelineEvent, TimelineEventDocument, TimelineEventType } from '../schemas/timeline-event.schema';
import { BulkImportDto, CreateProjectDto, EmitParecerDto } from '../validations/project.zod';
import { Counter, CounterDocument } from '../schemas/counter.schema';
import { Organization, OrganizationDocument } from '../../organization/schemas/organization.schema';
import { IUser } from '../../users/schemas/models/user.interface';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(TimelineEvent.name) private timelineEventModel: Model<TimelineEventDocument>,
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
  ) { }

  private async validatePlanLimitAndGetPrefix(orgId: string, incomingItemsCount: number = 1) {
    const org = await this.orgModel.findById(orgId).exec();
    if (!org) throw new NotFoundException('Organização não encontrada.');

    const plan = (org as any).plan || 'FREE';
    if (plan === 'FREE') {
      const currentCount = await this.projectModel.countDocuments({
        organizationId: new Types.ObjectId(String(orgId))
      });

      if (currentCount + incomingItemsCount > 2) {
        throw new ForbiddenException(`LIMITE_FREE_EXCEDIDO: Sua construtora atingiu o limite. O plano Gratuito permite 2 demandas. Evolua para o Plano PRO.`);
      }
    }

    let prefixoOrg = 'CAZ';
    if (org.acronym) {
      prefixoOrg = org.acronym;
    } else if (org.name) {
      prefixoOrg = org.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    }

    return { org, plan, prefixoOrg };
  }


  // Calcula a pontuação final multiplicando os valores (ex: 5 x 4 x 2 = 40)
  private calculatePriorityScore(details: Record<string, number>): number {
    const values = Object.values(details);
    if (values.length === 0) return 0;
    return values.reduce((acc, curr) => acc * curr, 1);
  }

  // CRIAÇÃO DA DEMANDA INICIAL
  async createProject(orgId: string, userId: string, data: CreateProjectDto) {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');

      const { prefixoOrg } = await this.validatePlanLimitAndGetPrefix(orgId, 1);

      const counterId = `DEMAND_${orgId}_${year}${month}`;
      const counter = await this.counterModel.findByIdAndUpdate(
        counterId,
        { $inc: { seq: 1 } }, // Incrementa +1 de forma bloqueante (atômica)
        { new: true, upsert: true } // Se não existir, cria começando no 1
      );

      // MONTAGEM DO CÓDIGO: [Org].[AnoMês].[000X]
      const sequencia = String(counter.seq).padStart(4, '0');
      const referenceCode = `${prefixoOrg}.${year}${month}${sequencia}`;

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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Falha estrutural ao registrar a demanda.');
    }
  }

  // IMPORTAÇÃO EM MASSA (BULK)
  async bulkImportProjects(orgId: string, userId: string, projectsData: any[]) {
    try {
      if (!projectsData || projectsData.length === 0) {
        throw new BadRequestException('O array de demandas está vazio.');
      }

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');

      // Validação de negócio (Plano Free vs Pro)
      const { prefixoOrg } = await this.validatePlanLimitAndGetPrefix(orgId, projectsData.length);

      const counterId = `DEMAND_${orgId}_${year}${month}`;

      const counter = await this.counterModel.findByIdAndUpdate(
        counterId,
        { $inc: { seq: projectsData.length } },
        { new: true, upsert: true }
      );

      // Descobre de qual número devemos começar a contar
      let startSequence = (counter.seq - projectsData.length) + 1;

      // MONTAR O LOTE PARA INSERÇÃO
      const bulkProjectsToInsert = [];
      const bulkEventsToInsert = [];

      const parseSafeDate = (dateStr: any) => {
        if (!dateStr || String(dateStr).trim() === '') return undefined;

        let safeDateString = String(dateStr).trim();

        // Se o usuário digitou no formato Brasileiro (DD/MM/YYYY), nós invertemos para YYYY-MM-DD
        if (safeDateString.includes('/')) {
          const parts = safeDateString.split('/');
          if (parts.length === 3) {
            safeDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }

        const dateObj = new Date(safeDateString);

        if (isNaN(dateObj.getTime())) return undefined;

        return dateObj;
      };

      for (const data of projectsData) {
        const sequencia = String(startSequence).padStart(4, '0');
        const referenceCode = `${prefixoOrg}.${year}${month}${sequencia}`;
        startSequence++; // Prepara para a próxima obra do loop

        const projectId = new Types.ObjectId(); // Gera o ID antes de salvar para linkar com a Timeline

        const projectDoc = {
          _id: projectId,
          organizationId: new Types.ObjectId(String(orgId)),
          createdBy: new Types.ObjectId(String(userId)),
          referenceCode: referenceCode,
          title: data.title || 'Demanda Sem Título', // Proteção extra caso venha vazio
          description: data.description || 'Importado via planilha CSV.',
          location: data.location || 'Não informada',
          status: data.status || 'DEMAND',

          priorityScore: isNaN(Number(data.priority)) ? 1 : Number(data.priority),
          startDate: parseSafeDate(data.startDate),
          endDate: parseSafeDate(data.endDate),

          attachments: [],
          // lastEventId num 2º passo
        };

        const eventDoc = {
          _id: new Types.ObjectId(),
          projectId: projectId,
          organizationId: new Types.ObjectId(String(orgId)),
          authorId: new Types.ObjectId(String(userId)),
          type: TimelineEventType.DOCUMENT,
          description: 'Demanda importada em lote via arquivo CSV.',
          referenceCode: referenceCode,
          metadata: {
            newStatus: projectDoc.status,
            isBulkImport: true
          }
        };

        // Linka o último evento ao projeto
        projectDoc['lastEventId'] = eventDoc._id;

        bulkProjectsToInsert.push(projectDoc);
        bulkEventsToInsert.push(eventDoc);
      }

      // Insere tudo de uma vez no MongoDB
      await this.projectModel.insertMany(bulkProjectsToInsert);
      await this.timelineEventModel.insertMany(bulkEventsToInsert);

      return {
        message: 'Importação concluída com sucesso',
        count: bulkProjectsToInsert.length
      };

    } catch (error) {
      console.error('ERRO REAL NO BULK IMPORT:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Falha catastrófica ao importar a planilha.');
    }
  }

  // EMISSÃO DO PARECER TÉCNICO E DEFINIÇÃO DE PRIORIDADE (COM GUT OPCIONAL)
  async emitParecerTecnico(orgId: string, projectId: string, userId: string, data: EmitParecerDto, userRole?: string) {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(String(projectId)),
      organizationId: new Types.ObjectId(String(orgId))
    });

    if (!project) {
      throw new NotFoundException('Demanda/Projeto não encontrada.');
    }

    // Código pai da demanda (Ex: CAZ.202603.0001). Se não tiver, usa o ID como fallback
    const referenceCode = project.referenceCode || String(project._id).substring(0, 8).toUpperCase();

    const isAssigned = project.assignedMembers?.some(memberId => memberId.toString() === userId.toString()) || false;
    const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
    const isCreator = project.createdBy && project.createdBy.toString() === userId.toString();

    if (!isAssigned && !isAdmin && !isCreator) {
      throw new ForbiddenException('Acesso negado: Você não tem permissão para emitir pareceres neste projeto.');
    }

    // A chave única do contador será: PRC_[ID_DA_OBRA]
    const counterId = `PRC_${projectId}`;
    const counter = await this.counterModel.findByIdAndUpdate(
      counterId,
      { $inc: { seq: 1 } }, // Incrementa atômico +1
      { new: true, upsert: true } // Se for o 1º parecer, ele cria o contador começando no 1
    );

    // Formata o sequencial do parecer com 4 dígitos (ex: 0001, 0002)
    const sequenciaParecer = String(counter.seq).padStart(4, '0');

    // Ex: CAZ.202603.0001.PRC.0001
    const parecerCode = `${referenceCode}.PRC.${sequenciaParecer}`;

    try {
      let statusChanged = false;
      if (data.newStatus && data.newStatus !== project.status) {
        project.status = data.newStatus as ProjectStatus;
        statusChanged = true;
      }

      if (data.technicalTitle) project.title = data.technicalTitle;
      if (data.startDate) project.startDate = new Date(data.startDate);
      if (data.endDate) project.endDate = new Date(data.endDate);
      if (data.location) project.location = data.location;

      const metadata: any = {
        statusChanged: statusChanged ? project.status : null
      };

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
        parecerCode: parecerCode,
        metadata: metadata
      });

      const savedEvent = await parecerEvent.save();

      project.lastEventId = savedEvent._id as any;
      await project.save();

      return project;
    } catch (error) {
      console.error('Erro ao emitir parecer:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Falha ao registrar o parecer técnico.');
    }
  }

  // LISTAGEM RÁPIDA (Ordenada por prioridade e data)
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

  // VISÃO DE DETALHE (Traz a Obra e a Timeline completa)
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

  // ALOCAÇÃO DE EQUIPE
  async assignMember(orgId: string, projectId: string, memberId: string) {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(String(projectId)),
        organizationId: new Types.ObjectId(String(orgId))
      },
      { $addToSet: { assignedMembers: new Types.ObjectId(String(memberId)) } },
      { new: true }
    )
      // .populate('assignedMembers', 'name') 
      .exec();

    if (!project) {
      throw new NotFoundException('Projeto não encontrado nesta organização.');
    }

    const timelineEvent = new this.timelineEventModel({
      projectId: project._id,
      organizationId: new Types.ObjectId(String(orgId)),
      authorId: new Types.ObjectId(String(memberId)),
      type: TimelineEventType.STATUS_CHANGE,
      description: `Membro adicionado à equipe.`,
    });
    await timelineEvent.save();

    return project;
  }

  // DESALOCAÇÃO DE EQUIPE
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

  // FEED DE ATIVIDADES (DASHBOARD)
  async getOrganizationTimeline(orgId: string) {
    return this.timelineEventModel
      .find({ organizationId: new Types.ObjectId(String(orgId)) })
      .sort({ createdAt: -1 }) // Traz os mais recentes primeiro
      .limit(15)
      .populate('authorId', 'name avatarUrl')
      .populate('projectId', 'title referenceCode')
      .exec();
  }

}