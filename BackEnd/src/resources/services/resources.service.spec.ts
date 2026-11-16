import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResourcesService } from './resources.service';
import { ResourceRepository } from '../repositories/resource.repository';
import { ResourceTransactionRepository } from '../repositories/resource-transaction.repository';
import { WarehouseRepository } from '../repositories/warehouse.repository';
import {
  ResourceType,
  TransactionStatus,
  TransactionType,
} from '../types/resource-enums';

describe('ResourcesService', () => {
  let service: ResourcesService;

  const mockResourceRepo = {
    create: jest.fn(),
    findAllByOrganization: jest.fn(),
    findById: jest.fn(),
    updateStock: jest.fn(),
    update: jest.fn(),
    inactivate: jest.fn(),
    sanitizeDecimalPrecision: jest.fn(),
  };

  const mockTransactionRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    markAsCanceled: jest.fn(),
    findPendingRequests: jest.fn(),
    updateRequestStatus: jest.fn(),
    findAllByOrganization: jest.fn(),
    findLatestEntriesByOrganization: jest.fn(),
    getProjectCostStatement: jest.fn(),
    sanitizeDecimalPrecision: jest.fn(),
  };

  const mockWarehouseRepo = {
    getOrCreate: jest.fn(),
    assignMember: jest.fn(),
    removeMember: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: ResourceRepository, useValue: mockResourceRepo },
        {
          provide: ResourceTransactionRepository,
          useValue: mockTransactionRepo,
        },
        { provide: WarehouseRepository, useValue: mockWarehouseRepo },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByOrganization', () => {
    it('deve anexar lastEntry e lastCanceledEntry por recurso', async () => {
      mockResourceRepo.findAllByOrganization.mockResolvedValue([
        { _id: 'res1', name: 'Cimento', type: ResourceType.MATERIAL },
        { _id: 'res2', name: 'Areia', type: ResourceType.MATERIAL },
      ]);

      mockTransactionRepo.findLatestEntriesByOrganization.mockResolvedValue([
        {
          _id: 'tx-active-newest',
          resourceId: 'res1',
          type: TransactionType.ENTRY,
          isCanceled: false,
          origin: 'NF 1002',
          notes: 'Entrada corrigida',
        },
        {
          _id: 'tx-canceled-newest',
          resourceId: 'res1',
          type: TransactionType.ENTRY,
          isCanceled: true,
          origin: 'NF 1001',
          cancelReason: 'Quantidade digitada errada',
        },
        {
          _id: 'tx-active-older',
          resourceId: 'res1',
          type: TransactionType.ENTRY,
          isCanceled: false,
          origin: 'NF 999',
        },
      ]);

      const result = await service.findAllByOrganization('org1');

      expect(result).toHaveLength(2);
      expect(result[0].lastEntry?._id).toBe('tx-active-newest');
      expect(result[0].lastCanceledEntry?._id).toBe('tx-canceled-newest');
      expect(result[1].lastEntry).toBeNull();
      expect(result[1].lastCanceledEntry).toBeNull();
    });
  });

  describe('addStock', () => {
    it('deve registrar entrada com observações e custo unitário 0 explícito', async () => {
      const orgId = '507f1f77bcf86cd799439011';
      const userId = '507f1f77bcf86cd799439012';
      const resourceId = '507f1f77bcf86cd799439013';

      mockResourceRepo.findById.mockResolvedValue({
        _id: resourceId,
        type: ResourceType.MATERIAL,
        standardCost: 50,
        isActive: true,
      });
      mockTransactionRepo.create.mockResolvedValue({ _id: 'tx1' });

      await service.addStock(orgId, userId, 'ADMIN', {
        resourceId,
        quantity: 10,
        unitCostSnapshot: 0,
        origin: 'NF 555 / Fornecedor Alpha',
        notes: 'Entrega parcial no portão 2',
      });

      expect(mockResourceRepo.updateStock).toHaveBeenCalledWith(resourceId, 10);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.ENTRY,
          quantity: 10,
          unitCostSnapshot: 0,
          totalCost: 0,
          origin: 'NF 555 / Fornecedor Alpha',
          notes: 'Entrega parcial no portão 2',
        }),
      );
    });
  });

  describe('cancelTransaction', () => {
    it('deve reverter estoque e marcar estorno para ENTRY aprovada', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        _id: 'tx1',
        organizationId: { toString: () => 'org1' },
        resourceId: { toString: () => 'res1' },
        type: TransactionType.ENTRY,
        status: TransactionStatus.APPROVED,
        quantity: 20,
        isCanceled: false,
      });
      mockResourceRepo.findById.mockResolvedValue({
        _id: 'res1',
        name: 'Cimento',
        unit: 'sc',
        type: ResourceType.MATERIAL,
      });
      mockTransactionRepo.markAsCanceled.mockResolvedValue({
        _id: 'tx1',
        isCanceled: true,
      });

      const result = await service.cancelTransaction(
        'org1',
        'tx1',
        'user1',
        'ADMIN',
        'Nota fiscal lançada em duplicidade',
      );

      expect(mockResourceRepo.updateStock).toHaveBeenCalledWith('res1', -20);
      expect(mockTransactionRepo.markAsCanceled).toHaveBeenCalledWith(
        'tx1',
        'user1',
        'Nota fiscal lançada em duplicidade',
      );
      expect(result.isCanceled).toBe(true);
    });

    it('deve lançar BadRequestException se transação já foi estornada', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        _id: 'tx1',
        organizationId: { toString: () => 'org1' },
        isCanceled: true,
      });

      await expect(
        service.cancelTransaction(
          'org1',
          'tx1',
          'user1',
          'ADMIN',
          'Motivo qualquer',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar UnauthorizedException se transação pertencer a outra organização', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        _id: 'tx1',
        organizationId: { toString: () => 'org-other' },
        isCanceled: false,
      });

      await expect(
        service.cancelTransaction(
          'org1',
          'tx1',
          'user1',
          'ADMIN',
          'Motivo qualquer',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('não deve alterar estoque se transação não estiver APPROVED', async () => {
      mockTransactionRepo.findById.mockResolvedValue({
        _id: 'tx1',
        organizationId: { toString: () => 'org1' },
        resourceId: { toString: () => 'res1' },
        type: TransactionType.ALLOCATION,
        status: TransactionStatus.PENDING,
        quantity: 5,
        isCanceled: false,
      });
      mockResourceRepo.findById.mockResolvedValue({
        _id: 'res1',
        name: 'Cimento',
        unit: 'sc',
        type: ResourceType.MATERIAL,
      });
      mockTransactionRepo.markAsCanceled.mockResolvedValue({
        _id: 'tx1',
        isCanceled: true,
      });

      await service.cancelTransaction(
        'org1',
        'tx1',
        'user1',
        'ADMIN',
        'Solicitação cancelada',
      );

      expect(mockResourceRepo.updateStock).not.toHaveBeenCalled();
      expect(mockTransactionRepo.markAsCanceled).toHaveBeenCalled();
    });
  });
});
