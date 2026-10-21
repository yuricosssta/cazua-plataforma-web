import { Test, TestingModule } from '@nestjs/testing';
import { ApiClientService } from './api-client.service';
import { API_CLIENT_REPOSITORY } from '../repositories/api-client.repository';
import { Types } from 'mongoose';
import * as crypto from 'crypto';

describe('ApiClientService', () => {
  let service: ApiClientService;

  const validOrgId = new Types.ObjectId();
  const mockClientInDb = {
    _id: new Types.ObjectId(),
    name: 'App Parceira',
    clientId: 'cli_12345',
    secretHash: crypto.createHash('sha256').update('sec_valid_secret').digest('hex'),
    allowedOrgIds: [validOrgId],
    defaultRole: 'MEMBER' as const,
    isActive: true,
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: new Types.ObjectId() })),
    findById: jest.fn().mockResolvedValue(mockClientInDb),
    findByClientId: jest.fn().mockImplementation((clientId) => {
      if (clientId === 'cli_12345') return Promise.resolve(mockClientInDb);
      return Promise.resolve(null);
    }),
    findAll: jest.fn().mockResolvedValue([mockClientInDb]),
    update: jest.fn().mockImplementation((id, data) => Promise.resolve({ ...mockClientInDb, ...data })),
    deactivate: jest.fn().mockResolvedValue({ ...mockClientInDb, isActive: false }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiClientService,
        { provide: API_CLIENT_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ApiClientService>(ApiClientService);
  });

  it('should create an ApiClient and return a generated clientSecret', async () => {
    const result = await service.create({
      name: 'Nova App',
      allowedOrgIds: [validOrgId.toString()],
      defaultRole: 'MEMBER',
    });

    expect(result).toBeDefined();
    expect(result.clientId).toMatch(/^cli_/);
    expect(result.clientSecret).toMatch(/^sec_/);
    expect(mockRepo.create).toHaveBeenCalled();
  });

  it('should validate valid client credentials', async () => {
    const client = await service.validateClientCredentials('cli_12345', 'sec_valid_secret');
    expect(client).toBeDefined();
    expect(client?.clientId).toBe('cli_12345');
  });

  it('should reject invalid client secret', async () => {
    const client = await service.validateClientCredentials('cli_12345', 'sec_wrong_secret');
    expect(client).toBeNull();
  });

  it('should reject non-existing client id', async () => {
    const client = await service.validateClientCredentials('cli_unknown', 'sec_any');
    expect(client).toBeNull();
  });

  it('should rotate secret successfully', async () => {
    const result = await service.rotateSecret(mockClientInDb._id.toString());
    expect(result.clientSecret).toMatch(/^sec_/);
    expect(mockRepo.update).toHaveBeenCalled();
  });
});
