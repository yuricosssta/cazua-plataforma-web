import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import { zodToOpenApi } from '../../shared/swagger/zod-to-openapi';
import {
  addMemberSchema,
  AddMemberDto,
  memberResponseSchema,
} from '../dto/add-member.dto';
import { z } from 'zod';

@ApiTags('Organizations')
@ApiBearerAuth('jwt')
@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(
    private readonly orgService: OrganizationService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova organização' })
  create(@Body() createDto: CreateOrganizationDto, @Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.orgService.create(createDto, userId);
  }

  @Get('my-orgs')
  @ApiOperation({
    summary: 'Listar organizações das quais o usuário participa',
  })
  getMyOrgs(@Req() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.orgService.findAllForUser(userId);
  }

  // Busca de membros ---
  @Get(':orgId/members')
  @ApiOperation({
    summary: 'Listar membros de uma organização',
    description: 'Requer que o usuário seja membro da organização ou Super Admin.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.array(memberResponseSchema)),
  })
  getMembers(@Param('orgId') orgId: string, @Req() req: any) {
    return this.orgService.findMembersByOrganization(orgId, req.user);
  }

  // Adição de membro
  @Post(':orgId/members')
  @ApiOperation({
    summary: 'Adicionar membro à organização',
    description:
      'Requer cargo OWNER ou ADMIN na organização. Se o usuário não existir no Cazuá, ele é criado globalmente.',
  })
  @ApiBody({ schema: zodToOpenApi(addMemberSchema) })
  @ApiResponse({
    status: 201,
    schema: zodToOpenApi(z.object({ message: z.string() })),
  })
  @UsePipes(new ZodValidationPipe(addMemberSchema))
  addMember(
    @Param('orgId') orgId: string,
    @Body() body: AddMemberDto,
    @Req() req: any,
  ) {
    return this.orgService.addMemberToOrganization(orgId, req.user, body);
  }

  // --- ATUALIZAR CARGO DO MEMBRO ---
  @Patch(':orgId/members/:userId/role')
  @ApiOperation({ summary: 'Atualizar cargo de um membro' })
  async updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body('role') role: string,
    @Req() req: any,
  ) {
    const adminId = req.user.sub || req.user.id;
    return this.orgService.updateMemberRole(orgId, adminId, userId, role);
  }

  // --- REMOVER MEMBRO DA ORGANIZAÇÃO ---
  @Delete(':orgId/members/:userId')
  @ApiOperation({ summary: 'Remover membro da organização' })
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Req() req: any,
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
      throw new ForbiddenException(
        'Acesso negado: Área restrita ao Administrador.',
      );
    }

    return this.orgService.findAllForSuperAdmin();
  }

  @Patch('admin/:id/plan')
  async updateOrgPlan(
    @Param('id') orgId: string,
    @Body('plan') plan: string,
    @Req() req: any,
  ) {
    const userEmail = req.user?.email;
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');

    if (userEmail !== superAdminEmail) {
      throw new ForbiddenException(
        'Acesso negado: Área restrita ao Master Admin.',
      );
    }

    return this.orgService.updatePlan(orgId, plan);
  }

  @Patch(':orgId/settings')
  async updateOrgSettings(
    @Param('orgId') orgId: string,
    @Body('settings') settings: any,
    @Req() req: any,
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
