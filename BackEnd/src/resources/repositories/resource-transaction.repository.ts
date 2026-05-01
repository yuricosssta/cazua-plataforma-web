//src/resources/repositories/resource-transaction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResourceTransaction, ResourceTransactionDocument } from '../schemas/resource-transaction.schema';

@Injectable()
export class ResourceTransactionRepository {
  constructor(
    @InjectModel(ResourceTransaction.name) private readonly model: Model<ResourceTransactionDocument>
  ) { }

  async create(data: Partial<ResourceTransaction>): Promise<ResourceTransaction> {
    const newTransaction = new this.model(data);
    return newTransaction.save();
  }

  async findById(id: string): Promise<ResourceTransaction> {
    const transaction = await this.model.findById(id).exec();
    if (!transaction) throw new Error('Transação não encontrada.');
    return transaction;
  }

  async markAsCanceled(id: string, userId: string, reason: string): Promise<ResourceTransaction> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      {
        isCanceled: true,
        canceledBy: userId,
        cancelReason: reason
      },
      { new: true }
    ).exec();

    if (!updated) throw new Error('Erro ao cancelar a transação.');
    return updated;
  }


  // Busca todas as requisições pendentes de uma organização
  async findPendingRequests(orgId: string): Promise<ResourceTransaction[]> {
    return this.model
      .find({
        organizationId: new Types.ObjectId(orgId),
        type: 'ALLOCATION',
        status: 'PENDING',
        isCanceled: false
      })
      .sort({ createdAt: 1 }) // Mais antigos primeiro (Fila)
      .exec();
  }

  // Atualiza o status da requisição
  async updateRequestStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    userId: string,
    approvedQuantity: number,
    totalCost: number,
    rejectedReason?: string
  ): Promise<ResourceTransaction> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      {
        status,
        approvedBy: userId,
        quantity: approvedQuantity,
        totalCost,
        rejectedReason
      },
      { new: true }
    ).exec();

    if (!updated) throw new Error('Transação não encontrada.');
    return updated;
  }

  async findAllByOrganization(orgId: string): Promise<ResourceTransaction[]> {
    return this.model
      .find({ organizationId: new Types.ObjectId(orgId) })
      .sort({ createdAt: -1 }) 
      .populate('resourceId', 'name unit') 
      .populate('projectId', 'title') 
      .exec();
  }
}