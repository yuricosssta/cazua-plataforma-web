// src/organization/controllers/organization.controller.ts

import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('organizations')
@UseGuards(AuthGuard) 
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

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

  // --- NOVA ROTA: Busca de membros ---
  @Get(':orgId/members')
  getMembers(@Param('orgId') orgId: string) {
    return this.orgService.findMembersByOrganization(orgId);
  }

  // --- NOVA ROTA: Adição de membro (O Front-end chama aqui!) ---
  @Post(':orgId/members')
  addMember(@Param('orgId') orgId: string, @Body() body: any) {
    return this.orgService.addMemberToOrganization(orgId, body);
  }

  // Curinga: Busca por slug (Sempre deixe rotas curingas genéricas no final)
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.orgService.findOneBySlug(slug);
  }
}

// import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
// import { OrganizationService } from '../services/organization.service';
// import { CreateOrganizationDto } from '../dto/create-organization.dto';
// import { AuthGuard } from '../../auth/auth.guard';

// @Controller('organizations')
// @UseGuards(AuthGuard) 
// export class OrganizationController {
//   constructor(private readonly orgService: OrganizationService) {}

//   @Post()
//   create(@Body() createDto: CreateOrganizationDto, @Req() req: any) {
//     const userId = req.user.sub || req.user.id; 
//     return this.orgService.create(createDto, userId);
//   }

//   @Get('my-orgs')
//   getMyOrgs(@Req() req: any) {
//     const userId = req.user.sub || req.user.id;
//     return this.orgService.findAllForUser(userId);
//   }

//   @Get(':slug')
//   getBySlug(@Param('slug') slug: string) {
//     return this.orgService.findOneBySlug(slug);
//   }
// }