// BackEnd/src/projects/controllers/project.controller.ts

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
} from '../validations/project.zod';//'../validations/projects.zod';

// A rota raiz fica aninhada na organização: /organizations/:orgId/projects
@Controller('organizations/:orgId/projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  // 1. CRIAR NOVA DEMANDA/OBRA
  // Rota: POST /organizations/:orgId/projects
  @Post()
  async createProject(
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(createProjectSchema)) data: CreateProjectDto,
    @Req() req: any,
  ) {
    // Extrai o ID do usuário logado (O autor da demanda)
    const userId = req.user.sub || req.user.id;
    return this.projectsService.createProject(orgId, userId, data);
  }

  // 2. LISTAR TODOS PROJETOS DA EMPRESA
  // Rota: GET /organizations/:orgId/projects
  @Get()
  async getProjects(@Param('orgId') orgId: string) {
    return this.projectsService.findAllByOrganization(orgId);
  }

  // 3. EMITIR PARECER TÉCNICO (E GERAR A PRIORIDADE)
  // Rota: POST /organizations/:orgId/projects/:projectId/parecer
  @Post(':projectId/parecer')
  async emitParecer(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(emitParecerSchema)) data: EmitParecerDto,
    @Req() req: any,
  ) {
    // Extrai o ID do usuário que está dando o parecer
    const userId = req.user.sub || req.user.id;
    const userRole = req.membership?.role || req.user?.role || 'MEMBER';
    return this.projectsService.emitParecerTecnico(orgId, projectId, userId, data, userRole);
  }

  // 4. DETALHES DA OBRA E TIMELINE COMPLETA
  // Rota: GET /organizations/:orgId/projects/:projectId
  @Get(':projectId')
  async getProjectDetails(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOneWithTimeline(orgId, projectId);
  }

  // 5. ALOCAR MEMBRO NA OBRA
  // Rota: POST /organizations/:orgId/projects/:projectId/members
  @Post(':projectId/members')
  async assignMemberToProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body('userId') userId: string,
  ) {
    return this.projectsService.assignMember(orgId, projectId, userId);
  }

  // 6. REMOVER MEMBRO DA OBRA
  // Rota: DELETE /organizations/:orgId/projects/:projectId/members/:userId
  @Delete(':projectId/members/:userId')
  async removeMemberFromProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.projectsService.removeMember(orgId, projectId, userId);
  }

}