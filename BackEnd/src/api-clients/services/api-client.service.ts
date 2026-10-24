import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import {
  API_CLIENT_REPOSITORY,
  IApiClientRepository,
} from '../repositories/api-client.repository';
import { CreateApiClientDto, UpdateApiClientDto } from '../dto/api-client.zod';
import { IApiClient } from '../schemas/models/api-client.interface';

@Injectable()
export class ApiClientService {
  constructor(
    @Inject(API_CLIENT_REPOSITORY)
    private readonly apiClientRepository: IApiClientRepository,
  ) {}

  private hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  async create(
    dto: CreateApiClientDto,
  ): Promise<IApiClient & { clientSecret: string }> {
    const clientId = `cli_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `sec_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = this.hashSecret(clientSecret);

    const allowedOrgIds = dto.allowedOrgIds.map((id) => new Types.ObjectId(id));

    const ownerUserId = dto.ownerUserId
      ? new Types.ObjectId(dto.ownerUserId)
      : undefined;

    const newClient = await this.apiClientRepository.create({
      name: dto.name,
      clientId,
      secretHash,
      allowedOrgIds,
      defaultRole: dto.defaultRole || 'MEMBER',
      ownerUserId,
      resetPasswordUrl: dto.resetPasswordUrl,
      isActive: true,
    });

    return {
      ...newClient,
      clientSecret,
    };
  }

  async findAll(): Promise<IApiClient[]> {
    return this.apiClientRepository.findAll();
  }

  async findById(id: string): Promise<IApiClient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido.');
    }
    const client = await this.apiClientRepository.findById(
      new Types.ObjectId(id),
    );
    if (!client) {
      throw new NotFoundException('API Client não encontrado.');
    }
    return client;
  }

  async findByClientId(clientId: string): Promise<IApiClient | null> {
    return this.apiClientRepository.findByClientId(clientId);
  }

  async update(id: string, dto: UpdateApiClientDto): Promise<IApiClient> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido.');
    }

    const clientObjectId = new Types.ObjectId(id);
    const existing = await this.apiClientRepository.findById(clientObjectId);
    if (!existing) {
      throw new NotFoundException('API Client não encontrado.');
    }

    const updateData: Partial<IApiClient> = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.allowedOrgIds !== undefined) {
      updateData.allowedOrgIds = dto.allowedOrgIds.map(
        (orgId) => new Types.ObjectId(orgId),
      );
    }

    if (dto.defaultRole !== undefined) {
      updateData.defaultRole = dto.defaultRole;
    }

    if (dto.ownerUserId !== undefined) {
      updateData.ownerUserId = dto.ownerUserId
        ? new Types.ObjectId(dto.ownerUserId)
        : null;
    }

    if (dto.resetPasswordUrl !== undefined) {
      updateData.resetPasswordUrl = dto.resetPasswordUrl || null;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const updated = await this.apiClientRepository.update(
      clientObjectId,
      updateData,
    );

    if (!updated) {
      throw new NotFoundException('Falha ao atualizar o API Client.');
    }

    return updated;
  }

  async rotateSecret(
    id: string,
  ): Promise<{ message: string; clientId: string; clientSecret: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido.');
    }

    const clientObjectId = new Types.ObjectId(id);
    const client = await this.apiClientRepository.findById(clientObjectId);
    if (!client) {
      throw new NotFoundException('API Client não encontrado.');
    }

    const newSecret = `sec_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = this.hashSecret(newSecret);

    await this.apiClientRepository.update(clientObjectId, { secretHash });

    return {
      message: 'Segredo rotacionado com sucesso.',
      clientId: client.clientId,
      clientSecret: newSecret,
    };
  }

  async deactivate(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de cliente inválido.');
    }

    const clientObjectId = new Types.ObjectId(id);
    const deactivated =
      await this.apiClientRepository.deactivate(clientObjectId);
    if (!deactivated) {
      throw new NotFoundException('API Client não encontrado.');
    }

    return { message: 'API Client desativado com sucesso.' };
  }

  async validateClientCredentials(
    clientId: string,
    clientSecret: string,
  ): Promise<IApiClient | null> {
    if (!clientId || !clientSecret) {
      return null;
    }

    const client = await this.apiClientRepository.findByClientId(clientId);
    if (!client || !client.isActive) {
      return null;
    }

    const providedHash = this.hashSecret(clientSecret);
    const bufProvided = Buffer.from(providedHash, 'hex');
    const bufStored = Buffer.from(client.secretHash, 'hex');

    if (bufProvided.length !== bufStored.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(bufProvided, bufStored)) {
      return null;
    }

    return client;
  }
}
