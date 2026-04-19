//src/projects/controllers/project.controller.ts
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../services/project.service';
import { ProjectMemberService } from '../services/project-member.service';
import { TimelineService } from '../services/timeline.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import {
  BulkImportDto,
  bulkImportSchema,
  CreateProjectDto,
  createProjectSchema,
  EmitParecerDto,
  emitParecerSchema,
} from '../validations/project.zod';

@Controller('organizations/:orgId/projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectMemberService: ProjectMemberService,
    private readonly timelineService: TimelineService
  ) { }

  // Função auxiliar para extrair o ID com segurança
  private extractUserId(req: any): string {
    return req.user?.sub || req.user?._id || req.user?.id;
  }

  // Função auxiliar para extrair e normalizar o Cargo (Role)
  private extractUserRole(req: any): string {
    const role = req.headers['x-org-role'] || req.membership?.role || req.user?.role || 'MEMBER';
    return String(role).toUpperCase();
  }

  // CRIAR NOVA DEMANDA/OBRA
  @Post()
  async createProject(
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(createProjectSchema)) data: CreateProjectDto,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.projectsService.createProject(orgId, userId, data);
  }

  // IMPORTAÇÃO EM MASSA DE PROJETOS
  @Post('bulk-import')
  async bulkImportProjects(
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(bulkImportSchema)) data: BulkImportDto,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    const userRole = this.extractUserRole(req);

    // TRAVA DE SEGURANÇA: Apenas Admins e Donos entram aqui
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      throw new ForbiddenException('Acesso negado: Apenas Administradores podem realizar importações em massa.');
    }

    // Passamos o array validado (data.projects) para o service
    return this.projectsService.bulkImportProjects(orgId, userId, data.projects);
  }

  // LISTAR TODOS PROJETOS DA EMPRESA
  @Get()
  async getProjects(@Param('orgId') orgId: string) {
    return this.projectsService.findAllByOrganization(orgId);
  }

  // TIMELINE GERAL DA EMPRESA (Dashboard)
  @Get('timeline')
  async getOrgTimeline(@Param('orgId') orgId: string) {
    return this.timelineService.getOrganizationTimeline(orgId);
  }

  // EMITIR PARECER TÉCNICO (E GERAR A PRIORIDADE)
  @Post(':projectId/parecer')
  async emitParecer(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(emitParecerSchema)) data: EmitParecerDto,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    const userRole = this.extractUserRole(req);

    return this.projectsService.emitParecerTecnico(orgId, projectId, userId, data, userRole);
  }

  // DETALHES DA OBRA E TIMELINE COMPLETA
  @Get(':projectId')
  async getProjectDetails(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOneWithTimeline(orgId, projectId);
  }

  // Adicionar Membro
  @Post(':projectId/members')
  async assignMember(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body() body: { memberId: string; memberName: string }
  ) {
    const actionByUserId = this.extractUserId(req);
    return this.projectMemberService.assignMember(orgId, projectId, body.memberId, actionByUserId, body.memberName);
  }

  // Remover Membro
  @Delete(':projectId/members/:memberId')
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
    @Body() body: { memberName: string }
  ) {
    const actionByUserId = this.extractUserId(req);
    return this.projectMemberService.removeMember(orgId, projectId, memberId, actionByUserId, body.memberName);
  }
}