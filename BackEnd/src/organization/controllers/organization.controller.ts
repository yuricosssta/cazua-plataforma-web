// src/organization/controllers/organization.controller.ts

import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { ConfigService } from '@nestjs/config';
import { IUser } from 'src/users/schemas/models/user.interface';

@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService, private readonly configService: ConfigService) { }

  @Post()
  create(@Body() createDto: CreateOrganizationDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.orgService.create(createDto, userId);
  }

  @Get('my-orgs')
  getMyOrgs(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.orgService.findAllForUser(userId);
  }

  // Busca de membros ---
  @Get(':orgId/members')
  getMembers(@Param('orgId') orgId: string) {
    return this.orgService.findMembersByOrganization(orgId);
  }

  // Adição de membro
  @Post(':orgId/members')
  addMember(@Param('orgId') orgId: string, @Body() body: any) {
    return this.orgService.addMemberToOrganization(orgId, body);
  }

  // --- ATUALIZAR CARGO DO MEMBRO ---
  @Patch(':orgId/members/:userId/role')
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body('role') role: string,
    @Req() req: any
  ) {
    const adminId = req.user.sub || req.user.id;
    return this.orgService.updateMemberRole(orgId, adminId, userId, role);
  }

  // --- REMOVER MEMBRO DA ORGANIZAÇÃO ---
  @Delete(':orgId/members/:userId')
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Req() req: any
  ) {
    const adminId = req.user.sub || req.user.id;
    return this.orgService.removeMemberFromOrganization(orgId, adminId, userId);
  }

  @Get('admin/all')
  async getAllForAdmin(@Req() req: any): Promise<any> {
    // A TRAVA DE DEUS
    const userEmail = req.user?.email; // Certifique-se de que seu token JWT tenha o email embutido
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');

    if (userEmail !== superAdminEmail) {
      throw new ForbiddenException('Acesso negado: Área restrita ao Administrador.');
    }

    return this.orgService.findAllForSuperAdmin();
  }

  @Patch('admin/:id/plan')
  async updateOrgPlan(
    @Param('id') orgId: string,
    @Body('plan') plan: string,
    @Req() req: any
  ) {
    const userEmail = req.user?.email;
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');

    if (userEmail !== superAdminEmail) {
      throw new ForbiddenException('Acesso negado: Área restrita ao Master Admin.');
    }

    return this.orgService.updatePlan(orgId, plan);
  }

  @Patch(':orgId/settings')
  async updateOrgSettings(
    @Param('orgId') orgId: string,
    @Body('settings') settings: any,
    @Req() req: any
  ) {
    const adminId = req.user.sub || req.user.id;
    return this.orgService.updateSettings(orgId, adminId, settings);
  }

  // Busca por slug
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.orgService.findOneBySlug(slug);
  }

}