//src/resources/repositories/warehouse.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Warehouse, WarehouseDocument } from '../schemas/warehouse.schema';

@Injectable()
export class WarehouseRepository {
  constructor(
    @InjectModel(Warehouse.name) private readonly model: Model<WarehouseDocument>
  ) {}

  // Padrão Lazy Initialization
  async getOrCreate(orgId: string): Promise<Warehouse> {
    let warehouse = await this.model.findOne({ organizationId: new (Types.ObjectId as any)(orgId) }).exec();
    if (!warehouse) {
      warehouse = await this.model.create({
        organizationId: new (Types.ObjectId as any)(orgId),
        assignedMembers: []
      });
    }
    return warehouse;
  }

  async assignMember(orgId: string, memberId: string): Promise<Warehouse> {
    return this.model.findOneAndUpdate(
      { organizationId: new (Types.ObjectId as any)(orgId) },
      { $addToSet: { assignedMembers: new (Types.ObjectId as any)(memberId) } },
      { new: true, upsert: true }
    ).exec();
  }

  async removeMember(orgId: string, memberId: string): Promise<Warehouse> {
    return this.model.findOneAndUpdate(
      { organizationId: new (Types.ObjectId as any)(orgId) },
      { $pull: { assignedMembers: new (Types.ObjectId as any)(memberId) } },
      { new: true }
    ).exec();
  }
}