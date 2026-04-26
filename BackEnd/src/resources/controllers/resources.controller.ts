//src/resources/controllers/resources.controller.ts
import { Controller, Post, Get, Body, Param, Req, UseGuards, Headers } from '@nestjs/common';
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
  CancelTransactionDto
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

  // 3. ALOCAR RECURSO NA OBRA (Retira do estoque e joga na Timeline)
  @Post('allocate/:projectId')
  async allocateToProject(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Req() req: any,
    @Body(new ZodValidationPipe(allocateResourceSchema)) data: AllocateResourceDto,
  ) {
    const authorId = this.extractUserId(req);

    return this.resourcesService.allocateToProject({
      orgId,
      projectId,
      authorId,
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
}