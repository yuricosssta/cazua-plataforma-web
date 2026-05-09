//src/resources/controllers/resources.controller.ts
import { Controller, Post, Get, Patch, Body, Param, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ResourcesService } from '../services/resources.service';
import { AuthGuard } from '../../auth/auth.guard';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import {
  createResourceSchema,
  CreateResourceDto,
  allocateResourceSchema,
  AllocateResourceDto,
  addStockSchema,
  AddStockDto,
  returnResourceSchema,
  ReturnResourceDto,
  cancelTransactionSchema,
  CancelTransactionDto,
  RejectRequestDto,
  approveRequestSchema,
  ApproveRequestDto,
  rejectRequestSchema
} from '../validations/resource.zod';

@Controller('organizations/:orgId/resources')
@UseGuards(AuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) { }

  private extractUserId(req: any): string {
    return req.user?.sub || req.user?._id || req.user?.id;
  }

  private extractUserRole(req: any): string {
    return req.headers['x-org-role'] || 'MEMBER';
  }

  // --- GESTÃO DA EQUIPE DO ALMOXARIFADO ---

  @Get('team')
  async getWarehouseTeam(@Param('orgId') orgId: string) {
    return this.resourcesService.getWarehouseTeam(orgId);
  }

  @Post('team/assign')
  async assignWarehouseMember(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Body('userId') userIdToAssign: string
  ) {
    const userRole = this.extractUserRole(req);
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas Administradores podem modificar a equipe do Almoxarifado.');
    }
    return this.resourcesService.assignWarehouseMember(orgId, userIdToAssign);
  }

  @Post('team/remove')
  async removeWarehouseMember(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Body('userId') userIdToRemove: string
  ) {
    const userRole = this.extractUserRole(req);
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas Administradores podem modificar a equipe do Almoxarifado.');
    }
    return this.resourcesService.removeWarehouseMember(orgId, userIdToRemove);
  }

  // --- OPERAÇÕES DO CATÁLOGO E ESTOQUE ---

  @Post()
  async createResource(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(createResourceSchema)) data: CreateResourceDto,
  ) {
    return this.resourcesService.createResource(orgId, this.extractUserId(req), this.extractUserRole(req), data);
  }

  @Get()
  async listResources(@Param('orgId') orgId: string) {
    return this.resourcesService.findAllByOrganization(orgId);
  }

  @Post('request/:projectId')
  async requestAllocation(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(allocateResourceSchema)) data: AllocateResourceDto,
  ) {
    return this.resourcesService.requestAllocation({
      orgId,
      projectId,
      authorId: this.extractUserId(req),
      resourceId: data.resourceId,
      quantity: data.quantity,
      origin: data.origin,
      attachments: data.attachments,
    });
  }

  @Post('transactions/:transactionId/approve')
  async approveRequest(
    @Param('orgId') orgId: string,
    @Param('transactionId') transactionId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(approveRequestSchema)) data: ApproveRequestDto,
  ) {
    return this.resourcesService.approveRequest(orgId, transactionId, this.extractUserId(req), this.extractUserRole(req), data.approvedQuantity);
  }

  @Post('transactions/:transactionId/reject')
  async rejectRequest(
    @Param('orgId') orgId: string,
    @Param('transactionId') transactionId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(rejectRequestSchema)) data: RejectRequestDto,
  ) {
    return this.resourcesService.rejectRequest(orgId, transactionId, this.extractUserId(req), this.extractUserRole(req), data.reason);
  }

  @Post('allocate-direct/:projectId')
  async allocateDirectly(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(allocateResourceSchema)) data: AllocateResourceDto,
  ) {
    return this.resourcesService.allocateDirectly(orgId, this.extractUserId(req), this.extractUserRole(req), {
      projectId: projectId,
      resourceId: data.resourceId,
      quantity: data.quantity,
      origin: data.origin,
      attachments: data.attachments,
    });
  }

  @Post('stock')
  async addStock(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(addStockSchema)) data: AddStockDto,
  ) {
    return this.resourcesService.addStock(orgId, this.extractUserId(req), this.extractUserRole(req), data);
  }

  @Post('return/:projectId')
  async returnFromProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(returnResourceSchema)) data: ReturnResourceDto,
  ) {
    return this.resourcesService.returnFromProject(orgId, projectId, this.extractUserId(req), this.extractUserRole(req), data);
  }

  @Post('transactions/:transactionId/cancel')
  async cancelTransaction(
    @Param('orgId') orgId: string,
    @Param('transactionId') transactionId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(cancelTransactionSchema)) data: CancelTransactionDto,
  ) {
    return this.resourcesService.cancelTransaction(orgId, transactionId, this.extractUserId(req), this.extractUserRole(req), data.reason);
  }

  @Get('transactions')
  async listTransactions(@Param('orgId') orgId: string) {
    return this.resourcesService.listTransactions(orgId);
  }

  @Patch(':resourceId')
  async updateResource(
    @Param('orgId') orgId: string,
    @Param('resourceId') resourceId: string,
    @Req() req: any,
    @Body() data: Partial<CreateResourceDto>,
  ) {
    return this.resourcesService.updateResource(orgId, resourceId, this.extractUserId(req), this.extractUserRole(req), data);
  }

  @Patch(':resourceId/inactivate')
  async inactivateResource(
    @Param('orgId') orgId: string,
    @Param('resourceId') resourceId: string,
    @Req() req: any,
  ) {
    return this.resourcesService.inactivateResource(orgId, resourceId, this.extractUserId(req), this.extractUserRole(req));
  }

  @Get('statement/:projectId')
  async getProjectStatement(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string
  ) {
    return this.resourcesService.getProjectStatement(orgId, projectId);
  }
}