//src/projects/controllers/project.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from '../services/project.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import {
  CreateProjectDto,
  createProjectSchema,
  EmitParecerDto,
  emitParecerSchema,
} from '../validations/project.zod';

@Controller('organizations/:orgId/projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  // Função auxiliar para extrair o ID com segurança
  private extractUserId(req: any): string {
    return req.user?.sub || req.user?._id || req.user?.id;
  }

  // Função auxiliar para extrair e normalizar o Cargo (Role)
  private extractUserRole(req: any): string {
    const role = req.headers['x-org-role'] || req.membership?.role || req.user?.role || 'MEMBER';
    return String(role).toUpperCase();
  }

  // 1. CRIAR NOVA DEMANDA/OBRA
  @Post()
  async createProject(
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(createProjectSchema)) data: CreateProjectDto,
    @Req() req: any,
  ) {
    const userId = this.extractUserId(req);
    return this.projectsService.createProject(orgId, userId, data);
  }

  // 2. LISTAR TODOS PROJETOS DA EMPRESA
  @Get()
  async getProjects(@Param('orgId') orgId: string) {
    return this.projectsService.findAllByOrganization(orgId);
  }

  // 3. EMITIR PARECER TÉCNICO (E GERAR A PRIORIDADE)
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

  // 4. DETALHES DA OBRA E TIMELINE COMPLETA
  @Get(':projectId')
  async getProjectDetails(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOneWithTimeline(orgId, projectId);
  }

  // 5. ALOCAR MEMBRO NA OBRA
  @Post(':projectId/members')
  async assignMemberToProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body('userId') userId: string,
  ) {
    return this.projectsService.assignMember(orgId, projectId, userId);
  }

  // 6. REMOVER MEMBRO DA OBRA
  @Delete(':projectId/members/:userId')
  async removeMemberFromProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(orgId, projectId, userId);
  }
}