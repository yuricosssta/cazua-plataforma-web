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

  // BUSCAR RECURSOS DA EMPRESA (Traz apenas os ativos por padrão)
  async findAllByOrganization(orgId: string, includeInactive = false): Promise<Resource[]> {
    const query: any = { organizationId: new Types.ObjectId(orgId) };
    
    if (!includeInactive) {
      // $ne: false garante compatibilidade com registros antigos que não possuíam a flag
      query.isActive = { $ne: false }; 
    }

    return this.model
      .find(query)
      .sort({ name: 1 })
      .exec();
  }

  async findById(id: string): Promise<Resource> {
    const resource = await this.model.findById(id).exec();
    if (!resource) throw new NotFoundException('Recurso não encontrado no catálogo.');
    return resource;
  }

  async updateStock(id: string, quantityChange: number): Promise<Resource> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $inc: { currentStock: quantityChange } },
      { new: true }
    ).exec();
    
    if (!updated) throw new NotFoundException('Recurso não encontrado.');
    return updated;
  }

  // ATUALIZAR DADOS DO RECURSO (Edição)
  async update(id: string, data: Partial<Resource>): Promise<Resource> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();
    
    if (!updated) throw new NotFoundException('Recurso não encontrado.');
    return updated;
  }

  // INATIVAR RECURSO (Soft Delete)
  async inactivate(id: string): Promise<Resource> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    ).exec();
    
    if (!updated) throw new NotFoundException('Recurso não encontrado.');
    return updated;
  }
}