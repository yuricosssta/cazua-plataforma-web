// src/resources/repositories/resource-transaction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResourceTransaction, ResourceTransactionDocument } from '../schemas/resource-transaction.schema';
import { TransactionStatus, TransactionType } from '../types/resource-enums';

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

  async findPendingRequests(orgId: string): Promise<ResourceTransaction[]> {
    return this.model
      .find({
        organizationId: new (Types.ObjectId as any)(orgId),
        type: 'ALLOCATION',
        status: 'PENDING',
        isCanceled: false
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateRequestStatus(
    id: string,
    status: TransactionStatus,
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
      .find({ organizationId: new (Types.ObjectId as any)(orgId) })
      .sort({ createdAt: -1 })
      .populate('resourceId', 'name unit')
      .populate('projectId', 'title')
      .exec();
  }

  // Método para gerar o demonstrativo de custos por projeto COM $ROUND na Pipeline
  async getProjectCostStatement(orgId: string, projectId: string): Promise<any> {
    const result = await this.model.aggregate([
      {
        $match: {
          organizationId: new (Types.ObjectId as any)(orgId),
          projectId: new (Types.ObjectId as any)(projectId),
          status: TransactionStatus.APPROVED,
          isCanceled: false,
          type: { $in: [TransactionType.ALLOCATION, TransactionType.RETURN] }
        }
      },
      {
        $lookup: {
          from: 'resources',
          localField: 'resourceId',
          foreignField: '_id',
          as: 'resourceDetails'
        }
      },
      { $unwind: '$resourceDetails' },
      {
        $project: {
          resourceId: '$resourceId',
          resourceName: '$resourceDetails.name',
          resourceUnit: '$resourceDetails.unit',
          resourceType: '$resourceDetails.type',
          // Ajusta o sinal do valor financeiro
          adjustedCost: {
            $cond: [
              { $eq: ['$type', TransactionType.RETURN] },
              { $multiply: ['$totalCost', -1] },
              '$totalCost'
            ]
          },
          // Ajusta o sinal da quantidade física
          adjustedQuantity: {
            $cond: [
              { $eq: ['$type', TransactionType.RETURN] },
              { $multiply: ['$quantity', -1] },
              '$quantity'
            ]
          }
        }
      },
      {
        $facet: {
          categories: [
            {
              $group: {
                _id: '$resourceType',
                total: { $sum: '$adjustedCost' }
              }
            },
            // Arredonda o subtotal de categorias na pipeline
            {
              $project: {
                _id: 1,
                total: { $round: ['$total', 2] }
              }
            }
          ],
          items: [
            {
              $group: {
                _id: '$resourceId',
                name: { $first: '$resourceName' },
                unit: { $first: '$resourceUnit' },
                type: { $first: '$resourceType' },
                quantity: { $sum: '$adjustedQuantity' },
                total: { $sum: '$adjustedCost' }
              }
            },
            // Arredonda as somas calculadas para remover qualquer dízima binária (IEEE 754)
            {
              $project: {
                name: 1,
                unit: 1,
                type: 1,
                quantity: { $round: ['$quantity', 2] },
                total: { $round: ['$total', 2] }
              }
            },
            { $sort: { total: -1 } }
          ]
        }
      }
    ]).exec();

    return result[0];
  }

  // Método para corrigir a precisão decimal de transações existentes usando $ROUND na Pipeline
  async sanitizeDecimalPrecision(orgId: string): Promise<any> {
    return this.model.updateMany(
      { organizationId: new (Types.ObjectId as any)(orgId) },
      [
        {
          $set: {
            quantity: { $round: ['$quantity', 2] },
            unitCostSnapshot: { $round: ['$unitCostSnapshot', 2] },
            totalCost: { $round: ['$totalCost', 2] }
          }
        }
      ]
    ).exec();
  }

}