//src/resources/services/resources.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResourceRepository } from '../repositories/resource.repository';
import { ResourceTransactionRepository } from '../repositories/resource-transaction.repository';
import { ResourceType, TransactionStatus, TransactionType } from '../types/resource-enums';
import { Types } from 'mongoose';
import { CreateResourceDto } from '../validations/resource.zod';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly resourceRepo: ResourceRepository,
    private readonly transactionRepo: ResourceTransactionRepository,
    private readonly eventEmitter: EventEmitter2
  ) { }

  // 1. CRIAR RECURSO NO CATÁLOGO
  async createResource(orgId: string, data: CreateResourceDto) {
    return this.resourceRepo.create({
      ...data,
      organizationId: new Types.ObjectId(orgId),
    });
  }

  // 2. LISTAR CATÁLOGO DA EMPRESA
  async findAllByOrganization(orgId: string) {
    return this.resourceRepo.findAllByOrganization(orgId);
  }

  // 3. ENGENHEIRO PEDE MATERIAL (Requisição PENDING - Não mexe no estoque)
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

    const transaction = await this.transactionRepo.create({
      organizationId: new Types.ObjectId(data.orgId),
      projectId: new Types.ObjectId(data.projectId),
      resourceId: new Types.ObjectId(data.resourceId),
      authorId: new Types.ObjectId(data.authorId),
      type: TransactionType.ALLOCATION,
      status: TransactionStatus.PENDING,
      quantity: data.quantity,
      unitCostSnapshot: resource.standardCost,
      totalCost: 0, // Custo zero até ser aprovado
      origin: data.origin,
      attachments: data.attachments || [],
      isStockNegative: false,
    });

    // Opcional: Você pode emitir um evento para avisar o almoxarife aqui

    return transaction;
  }

  // ALMOXARIFADO APROVA E LIBERA MATERIAL (Mexe no estoque e Timeline)
  async approveRequest(transactionId: string, authorId: string, approvedQuantity: number) {
    const transaction = await this.transactionRepo.findById(transactionId);
    if (transaction.status !== TransactionStatus.PENDING) throw new Error('Esta requisição não está pendente.');

    const resource = await this.resourceRepo.findById(transaction.resourceId.toString());

    // Calcula estoque negativo
    let isStockNegative = false;
    if (resource.type === ResourceType.MATERIAL || resource.type === ResourceType.EQUIPMENT) {
      if (resource.currentStock - approvedQuantity < 0) {
        isStockNegative = true;
      }
      // Dá baixa no estoque
      await this.resourceRepo.updateStock(transaction.resourceId.toString(), -approvedQuantity);
    }

    // Calcula custo final
    const finalTotalCost = approvedQuantity * transaction.unitCostSnapshot;

    // Atualiza transação
    const approvedTx = await this.transactionRepo.updateRequestStatus(
      transactionId,
      TransactionStatus.APPROVED,
      authorId,
      approvedQuantity,
      finalTotalCost
    );

    // Grita na Timeline da Obra que o material foi liberado!
    this.eventEmitter.emit('timeline.create', {
      orgId: transaction.organizationId.toString(),
      projectId: transaction.projectId.toString(),
      authorId: authorId,
      type: 'REPORT',
      description: `Alocação Aprovada: ${approvedQuantity} ${resource.unit} de ${resource.name} enviados para a obra.`,
      metadata: {
        totalCost: finalTotalCost,
        resourceName: resource.name,
        isStockNegative: isStockNegative,
        attachments: transaction.attachments || [],
      },
    });

    return approvedTx;
  }

  // 3.2 ALMOXARIFADO REJEITA PEDIDO
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

  // 4. ENTRADA NO ESTOQUE / APORTE (COMPRA)
  async addStock(orgId: string, authorId: string, data: any) {
    const resource = await this.resourceRepo.findById(data.resourceId);

    if (resource.type === ResourceType.MATERIAL || resource.type === ResourceType.EQUIPMENT) {
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

  // 5. DEVOLUÇÃO DA OBRA (Sobrou material na obra e voltou pro galpão)
  async returnFromProject(orgId: string, projectId: string, authorId: string, data: any) {
    const resource = await this.resourceRepo.findById(data.resourceId);

    if (resource.type === ResourceType.MATERIAL || resource.type === ResourceType.EQUIPMENT) {
      await this.resourceRepo.updateStock(data.resourceId, data.quantity); // Soma de volta
    }

    const transaction = await this.transactionRepo.create({
      organizationId: new Types.ObjectId(orgId),
      projectId: new Types.ObjectId(projectId),
      resourceId: new Types.ObjectId(data.resourceId),
      authorId: new Types.ObjectId(authorId),
      type: TransactionType.RETURN,
      quantity: data.quantity,
      unitCostSnapshot: resource.standardCost, // Congela o custo atual
      totalCost: data.quantity * resource.standardCost,
      origin: data.origin,
      attachments: data.attachments || [],
    });

    this.eventEmitter.emit('timeline.create', {
      orgId, projectId, authorId,
      type: 'REPORT',
      description: `Devolução de Recurso: ${data.quantity} ${resource.unit} de ${resource.name} voltaram para o estoque.`,
      metadata: { totalCost: transaction.totalCost, resourceName: resource.name, isReturn: true, attachments: data.attachments || [] },
    });

    return transaction;
  }

  // 6. O ESTORNO DE SEGURANÇA (AUDITORIA)
  async cancelTransaction(transactionId: string, authorId: string, reason: string) {
    const transaction = await this.transactionRepo.findById(transactionId);

    if (transaction.isCanceled) throw new Error('Esta transação já foi estornada.');

    // Matemática Reversa de Estoque (Apenas para MATERIAIS ou EQUIPAMENTOS)
    const resource = await this.resourceRepo.findById(transaction.resourceId.toString());

    if (resource.type === ResourceType.MATERIAL || resource.type === ResourceType.EQUIPMENT) {
      if (transaction.type === TransactionType.ENTRY || transaction.type === TransactionType.RETURN) {
        // Se era uma entrada, a correção é tirar do estoque
        await this.resourceRepo.updateStock(transaction.resourceId.toString(), -transaction.quantity);
      } else if (transaction.type === TransactionType.ALLOCATION) {
        // Se era uma alocação (tirou do estoque), a correção é devolver pro estoque
        await this.resourceRepo.updateStock(transaction.resourceId.toString(), transaction.quantity);
      }
    }

    // Marca como cancelado
    const canceledTx = await this.transactionRepo.markAsCanceled(transactionId, authorId, reason);

    // Se a transação afetou uma obra, avisa na Timeline que foi estornada!
    if (transaction.projectId) {
      this.eventEmitter.emit('timeline.create', {
        orgId: transaction.organizationId.toString(),
        projectId: transaction.projectId.toString(),
        authorId: authorId,
        type: 'STATUS_CHANGE',
        description: `Estorno de Lançamento: Uma movimentação de ${transaction.quantity} ${resource.unit} de ${resource.name} foi estornada. Motivo: ${reason}`,
      });
    }

    return canceledTx;
  }

  // 7. LISTAR O HISTÓRICO (RAZÃO) DA EMPRESA
  async listTransactions(orgId: string) {
    return this.transactionRepo.findAllByOrganization(orgId);
  }
}