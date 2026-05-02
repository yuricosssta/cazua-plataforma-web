import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
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

  // Função auxiliar padronizada para extrair o ID do usuário logado
  private extractUserId(req: any): string {
    return req.user?.sub || req.user?._id || req.user?.id;
  }

  // 1. CRIAR NOVO RECURSO NO CATÁLOGO (Ex: Cadastrar "Saco de Cimento")
  @Post()
  async createResource(
    @Param('orgId') orgId: string,
    @Body(new ZodValidationPipe(createResourceSchema)) data: CreateResourceDto,
  ) {
    return this.resourcesService.createResource(orgId, data);
  }

  // 2. LISTAR O CATÁLOGO E ESTOQUE DA EMPRESA
  @Get()
  async listResources(@Param('orgId') orgId: string) {
    return this.resourcesService.findAllByOrganization(orgId);
  }

  // 3. ENGENHEIRO PEDE RECURSO (Cai na fila do Almoxarifado)
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

  // 3.1 ALMOXARIFE APROVA PEDIDO
  @Post('transactions/:transactionId/approve')
  async approveRequest(
    @Param('transactionId') transactionId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(approveRequestSchema)) data: ApproveRequestDto,
  ) {
    return this.resourcesService.approveRequest(transactionId, this.extractUserId(req), data.approvedQuantity);
  }

  // 3.2 ALMOXARIFE REJEITA PEDIDO
  @Post('transactions/:transactionId/reject')
  async rejectRequest(
    @Param('transactionId') transactionId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(rejectRequestSchema)) data: RejectRequestDto,
  ) {
    return this.resourcesService.rejectRequest(transactionId, this.extractUserId(req), data.reason);
  }

  // 3.3 SAÍDA DIRETA DO ALMOXARIFADO PARA A OBRA
  @Post('allocate-direct/:projectId')
  async allocateDirectly(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(allocateResourceSchema)) data: AllocateResourceDto,
  ) {
    return this.resourcesService.allocateDirectly(orgId, this.extractUserId(req), {
      projectId: projectId,
      resourceId: data.resourceId,
      quantity: data.quantity,
      origin: data.origin,
      attachments: data.attachments,
    });
  }

  // 4. DAR ENTRADA NO ESTOQUE (Compra / Aporte)
  @Post('stock')
  async addStock(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(addStockSchema)) data: AddStockDto,
  ) {
    return this.resourcesService.addStock(orgId, this.extractUserId(req), data);
  }

  // 5. DEVOLUÇÃO DA OBRA
  @Post('return/:projectId')
  async returnFromProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(returnResourceSchema)) data: ReturnResourceDto,
  ) {
    return this.resourcesService.returnFromProject(orgId, projectId, this.extractUserId(req), data);
  }

  // 6. ESTORNO DE TRANSAÇÃO (AUDITORIA)
  @Post('transactions/:transactionId/cancel')
  async cancelTransaction(
    @Param('transactionId') transactionId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(cancelTransactionSchema)) data: CancelTransactionDto,
  ) {
    return this.resourcesService.cancelTransaction(transactionId, this.extractUserId(req), data.reason);
  }

  // 7. LISTAR O HISTÓRICO DE TRANSAÇÕES
  @Get('transactions')
  async listTransactions(@Param('orgId') orgId: string) {
    return this.resourcesService.listTransactions(orgId);
  }
}