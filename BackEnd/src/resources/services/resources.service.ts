//src/resources/services/resources.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResourceRepository } from '../repositories/resource.repository';
import { ResourceTransactionRepository } from '../repositories/resource-transaction.repository';
import { ResourceType, TransactionStatus, TransactionType } from '../types/resource-enums';
import { Types } from 'mongoose';
import { CreateResourceDto } from '../validations/resource.zod';
import { TimelineEventType } from 'src/projects/schemas/timeline-event.schema';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly resourceRepo: ResourceRepository,
    private readonly transactionRepo: ResourceTransactionRepository,
    private readonly eventEmitter: EventEmitter2
  ) { }

  private getResourceDescription(resource: any, data: any): string {
    let description: string;
    if (resource.type === ResourceType.CAPITAL) {
      description = `solicitou ${resource.unit} ${data.quantity} de ${resource.name}. Aguardando Almoxarifado.`;    
    } else {
      description = `solicitou ${data.quantity} ${resource.unit} de ${resource.name}. Aguardando Almoxarifado.`;
    };
    
    return description;
  }
  
  private isStockableResource(type: ResourceType): boolean {
    return [ResourceType.MATERIAL, ResourceType.EQUIPMENT, ResourceType.CAPITAL].includes(type);
  }

  private emitTimelineEvent(data: { orgId: string, projectId: string, authorId: string, type: string, description: string, metadata?: any }) {
    this.eventEmitter.emit('timeline.create', data); 
  }

  async createResource(orgId: string, data: CreateResourceDto) {
    return this.resourceRepo.create({
      ...data,
      organizationId: new Types.ObjectId(orgId),
    });
  }

  async findAllByOrganization(orgId: string) {
    return this.resourceRepo.findAllByOrganization(orgId);
  }

  // 8. ATUALIZAR RECURSO (Edição Controlada)
  async updateResource(orgId: string, resourceId: string, data: Partial<CreateResourceDto>) {
    const resource = await this.resourceRepo.findById(resourceId);

    if (resource.organizationId.toString() !== orgId) {
      throw new UnauthorizedException('Acesso negado a este recurso.');
    }

    // Trava de segurança estrutural
    if (resource.currentStock !== 0) {
      if (data.type && data.type !== resource.type) {
        throw new BadRequestException('Não é possível alterar a categoria de um recurso que possui saldo no almoxarifado.');
      }
      if (data.unit && data.unit !== resource.unit) {
        throw new BadRequestException('Não é possível alterar a unidade de medida de um recurso que possui saldo no almoxarifado.');
      }
    }

    return this.resourceRepo.update(resourceId, data);
  }

  // 9. INATIVAR RECURSO (Soft Delete)
  async inactivateResource(orgId: string, resourceId: string) {
    const resource = await this.resourceRepo.findById(resourceId);

    if (resource.organizationId.toString() !== orgId) {
      throw new UnauthorizedException('Acesso negado a este recurso.');
    }

    // Trava contábil: Não pode esconder recurso com dinheiro/material pendente
    if (resource.currentStock !== 0) {
      throw new BadRequestException('Zere o saldo deste recurso (via estorno ou saída) antes de inativá-lo.');
    }

    return this.resourceRepo.inactivate(resourceId);
  }

  async requestAllocation(data: {
    orgId: string;
    projectId: string;
    authorId: string;
    resourceId: string;
    quantity: number;
    origin?: string;
    attachments?: string[];
  }) {
    const resource = await this.resourceRepo.findById(data.resourceId);
    if (resource.isActive === false) throw new BadRequestException('Este recurso está inativo e não pode ser solicitado.');

    const transaction = await this.transactionRepo.create({
      organizationId: new Types.ObjectId(data.orgId),
      projectId: new Types.ObjectId(data.projectId),
      resourceId: new Types.ObjectId(data.resourceId),
      authorId: new Types.ObjectId(data.authorId),
      type: TransactionType.ALLOCATION,
      status: TransactionStatus.PENDING,
      quantity: data.quantity,
      unitCostSnapshot: resource.standardCost,
      totalCost: 0,
      origin: data.origin,
      attachments: data.attachments || [],
      isStockNegative: false,
    });

    this.emitTimelineEvent({
      orgId: data.orgId,
      projectId: data.projectId,
      authorId: data.authorId,
      type: TimelineEventType.STATUS_CHANGE,
      description: this.getResourceDescription(resource, data),
      metadata: { resourceName: resource.name, status: 'PENDING' },
    });
    return transaction;
  }

  async approveRequest(transactionId: string, authorId: string, approvedQuantity: number) {
    const transaction = await this.transactionRepo.findById(transactionId);
    if (transaction.status !== TransactionStatus.PENDING) throw new Error('Esta requisição não está pendente.');

    const resource = await this.resourceRepo.findById(transaction.resourceId.toString());
    let isStockNegative = false;

    if (this.isStockableResource(resource.type)) {
      if (resource.currentStock - approvedQuantity < 0) isStockNegative = true;
      await this.resourceRepo.updateStock(transaction.resourceId.toString(), -approvedQuantity);
    }

    const finalTotalCost = approvedQuantity * transaction.unitCostSnapshot;

    const approvedTx = await this.transactionRepo.updateRequestStatus(
      transactionId,
      TransactionStatus.APPROVED,
      authorId,
      approvedQuantity,
      finalTotalCost
    );

    this.emitTimelineEvent({
      orgId: transaction.organizationId.toString(),
      projectId: transaction.projectId.toString(),
      authorId,
      type: TimelineEventType.STATUS_CHANGE,
      description: `adicionou ${approvedQuantity} ${resource.unit} de ${resource.name} ao projeto.`,
      metadata: { totalCost: finalTotalCost, resourceName: resource.name, isStockNegative, attachments: transaction.attachments || [] },
    });

    return approvedTx;
  }

  async rejectRequest(transactionId: string, authorId: string, reason: string) {
    const transaction = await this.transactionRepo.findById(transactionId);
    if (transaction.status !== TransactionStatus.PENDING) throw new Error('Esta requisição não está pendente.');

    return this.transactionRepo.updateRequestStatus(
      transactionId,
      TransactionStatus.REJECTED,
      authorId,
      transaction.quantity,
      0,
      reason
    );
  }

  async allocateDirectly(orgId: string, authorId: string, data: {
    projectId: string;
    resourceId: string;
    quantity: number;
    origin?: string;
    attachments?: string[];
  }) {
    const resource = await this.resourceRepo.findById(data.resourceId);
    if (resource.isActive === false) throw new BadRequestException('Este recurso está inativo.');
    
    let isStockNegative = false;

    if (this.isStockableResource(resource.type)) {
      if (resource.currentStock - data.quantity < 0) isStockNegative = true;
      await this.resourceRepo.updateStock(data.resourceId, -data.quantity);
    }

    const transaction = await this.transactionRepo.create({
      organizationId: new Types.ObjectId(orgId),
      projectId: new Types.ObjectId(data.projectId),
      resourceId: new Types.ObjectId(data.resourceId),
      authorId: new Types.ObjectId(authorId),
      type: TransactionType.ALLOCATION,
      status: TransactionStatus.APPROVED,
      quantity: data.quantity,
      unitCostSnapshot: resource.standardCost,
      totalCost: data.quantity * resource.standardCost,
      origin: data.origin,
      attachments: data.attachments || [],
      isStockNegative,
    });

    this.emitTimelineEvent({
      orgId,
      projectId: data.projectId,
      authorId,
      type: TimelineEventType.STATUS_CHANGE,
      description: `Movimento de ${data.quantity} ${resource.unit} de ${resource.name} alocados ao projeto.`,
      metadata: { totalCost: transaction.totalCost, resourceName: resource.name, isStockNegative, attachments: data.attachments || [] },
    });

    return transaction;
  }

  async addStock(orgId: string, authorId: string, data: any) {
    const resource = await this.resourceRepo.findById(data.resourceId);
    if (resource.isActive === false) throw new BadRequestException('Este recurso está inativo e não pode receber novas entradas.');

    if (this.isStockableResource(resource.type)) {
      await this.resourceRepo.updateStock(data.resourceId, data.quantity);
    }

    return this.transactionRepo.create({
      organizationId: new Types.ObjectId(orgId),
      resourceId: new Types.ObjectId(data.resourceId),
      authorId: new Types.ObjectId(authorId),
      type: TransactionType.ENTRY,
      quantity: data.quantity,
      unitCostSnapshot: data.unitCostSnapshot || resource.standardCost,
      totalCost: data.quantity * (data.unitCostSnapshot || resource.standardCost),
      origin: data.origin,
      attachments: data.attachments || [],
    });
  }

  async returnFromProject(orgId: string, projectId: string, authorId: string, data: any) {
    const resource = await this.resourceRepo.findById(data.resourceId);

    if (this.isStockableResource(resource.type)) {
      await this.resourceRepo.updateStock(data.resourceId, data.quantity);
    }

    const transaction = await this.transactionRepo.create({
      organizationId: new Types.ObjectId(orgId),
      projectId: new Types.ObjectId(projectId),
      resourceId: new Types.ObjectId(data.resourceId),
      authorId: new Types.ObjectId(authorId),
      type: TransactionType.RETURN,
      quantity: data.quantity,
      unitCostSnapshot: resource.standardCost,
      totalCost: data.quantity * resource.standardCost,
      origin: data.origin,
      attachments: data.attachments || [],
    });

    this.emitTimelineEvent({
      orgId,
      projectId,
      authorId,
      type: TimelineEventType.STATUS_CHANGE,
      description: `devolveu ${data.quantity} ${resource.unit} de ${resource.name} para o estoque/caixa.`,
      metadata: { totalCost: transaction.totalCost, resourceName: resource.name, isReturn: true, attachments: data.attachments || [] },
    });

    return transaction;
  }

  async cancelTransaction(transactionId: string, authorId: string, reason: string) {
    const transaction = await this.transactionRepo.findById(transactionId);
    if (transaction.isCanceled) throw new Error('Esta transação já foi estornada.');

    const resource = await this.resourceRepo.findById(transaction.resourceId.toString());

    if (this.isStockableResource(resource.type)) {
      if (transaction.type === TransactionType.ENTRY || transaction.type === TransactionType.RETURN) {
        await this.resourceRepo.updateStock(transaction.resourceId.toString(), -transaction.quantity);
      } else if (transaction.type === TransactionType.ALLOCATION) {
        await this.resourceRepo.updateStock(transaction.resourceId.toString(), transaction.quantity);
      }
    }

    const canceledTx = await this.transactionRepo.markAsCanceled(transactionId, authorId, reason);

    if (transaction.projectId) {
      this.emitTimelineEvent({
        orgId: transaction.organizationId.toString(),
        projectId: transaction.projectId.toString(),
        authorId,
        type: TimelineEventType.STATUS_CHANGE,
        description: `estornou lançamento de ${transaction.quantity} ${resource.unit} de ${resource.name}. Motivo: ${reason}`,
      });
    }

    return canceledTx;
  }

  async listTransactions(orgId: string) {
    return this.transactionRepo.findAllByOrganization(orgId);
  }
}