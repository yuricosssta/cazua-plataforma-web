import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IApiClientRepository } from '../api-client.repository';
import { ApiClient, ApiClientDocument } from '../../schemas/api-client.schema';
import { IApiClient } from '../../schemas/models/api-client.interface';

@Injectable()
export class ApiClientMongooseRepository implements IApiClientRepository {
  constructor(
    @InjectModel(ApiClient.name)
    private readonly clientModel: Model<ApiClientDocument>,
  ) {}

  async create(client: Partial<IApiClient>): Promise<IApiClient> {
    const created = new this.clientModel(client);
    const saved = await created.save();
    return saved.toObject() as unknown as IApiClient;
  }

  async findById(id: Types.ObjectId): Promise<IApiClient | null> {
    const validId = new Types.ObjectId(id);
    const client = await this.clientModel
      .findById(validId)
      .select('-secretHash')
      .populate('ownerUserId', 'name email')
      .lean<IApiClient>()
      .exec();
    return client || null;
  }

  async findByClientId(clientId: string): Promise<IApiClient | null> {
    const client = await this.clientModel
      .findOne({ clientId, isActive: true })
      .lean<IApiClient>()
      .exec();
    return client || null;
  }

  async findAll(): Promise<IApiClient[]> {
    const clients = await this.clientModel
      .find()
      .select('-secretHash')
      .populate('ownerUserId', 'name email')
      .sort({ createdAt: -1 })
      .lean<IApiClient[]>()
      .exec();
    return clients;
  }

  async update(
    id: Types.ObjectId,
    data: Partial<IApiClient>,
  ): Promise<IApiClient | null> {
    const validId = new Types.ObjectId(id);
    const updated = await this.clientModel
      .findByIdAndUpdate(validId, { $set: data }, { new: true })
      .select('-secretHash')
      .populate('ownerUserId', 'name email')
      .lean<IApiClient>()
      .exec();
    return updated || null;
  }

  async deactivate(id: Types.ObjectId): Promise<IApiClient | null> {
    const validId = new Types.ObjectId(id);
    const deactivated = await this.clientModel
      .findByIdAndUpdate(validId, { $set: { isActive: false } }, { new: true })
      .lean<IApiClient>()
      .exec();
    return deactivated || null;
  }
}
