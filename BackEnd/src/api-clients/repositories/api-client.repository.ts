import { Types } from 'mongoose';
import { IApiClient } from '../schemas/models/api-client.interface';

export interface IApiClientRepository {
  create(client: Partial<IApiClient>): Promise<IApiClient>;
  findById(id: Types.ObjectId): Promise<IApiClient | null>;
  findByClientId(clientId: string): Promise<IApiClient | null>;
  findAll(): Promise<IApiClient[]>;
  update(
    id: Types.ObjectId,
    data: Partial<IApiClient>,
  ): Promise<IApiClient | null>;
  deactivate(id: Types.ObjectId): Promise<IApiClient | null>;
}

export const API_CLIENT_REPOSITORY = 'IApiClientRepository';
