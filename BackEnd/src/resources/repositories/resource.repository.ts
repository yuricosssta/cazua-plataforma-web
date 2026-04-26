//src/resources/repositories/resource.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resource, ResourceDocument } from '../schemas/resource.schema';

@Injectable()
export class ResourceRepository {
  constructor(
    @InjectModel(Resource.name) private readonly model: Model<ResourceDocument>
  ) {}

  // CRIAR NOVO RECURSO NO BANCO
  async create(data: Partial<Resource>): Promise<Resource> {
    const newResource = new this.model(data);
    return newResource.save();
  }

  // BUSCAR TODOS OS RECURSOS DA EMPRESA (Ordenados por nome)
  async findAllByOrganization(orgId: string): Promise<Resource[]> {
    return this.model
      .find({ organizationId: new Types.ObjectId(orgId) })
      .sort({ name: 1 })
      .exec();
  }

  async findById(id: string): Promise<Resource> {
    const resource = await this.model.findById(id).exec();
    if (!resource) throw new NotFoundException('Recurso não encontrado no catálogo.');
    return resource;
  }

  async updateStock(id: string, quantityChange: number): Promise<Resource> {
    // Incrementa ou decrementa o estoque de forma atômica
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $inc: { currentStock: quantityChange } },
      { new: true }
    ).exec();
    
    if (!updated) throw new NotFoundException('Recurso não encontrado.');
    return updated;
  }
}