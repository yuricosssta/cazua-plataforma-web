// src/resources/controllers/resources.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from '../services/resources.service';
import { ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';

describe('ResourcesController', () => {
  let controller: ResourcesController;
  let service: jest.Mocked<ResourcesService>;

  const mockResourcesService = {
    sanitizeDecimals: jest.fn(),
    getWarehouseTeam: jest.fn(),
    assignWarehouseMember: jest.fn(),
    removeWarehouseMember: jest.fn(),
    createResource: jest.fn(),
    findAllByOrganization: jest.fn(),
    requestAllocation: jest.fn(),
    approveRequest: jest.fn(),
    rejectRequest: jest.fn(),
    allocateDirectly: jest.fn(),
    addStock: jest.fn(),
    returnFromProject: jest.fn(),
    cancelTransaction: jest.fn(),
    listTransactions: jest.fn(),
    updateResource: jest.fn(),
    inactivateResource: jest.fn(),
    getProjectStatement: jest.fn(),
  };

  const mockRequest = (userId: string = 'user123', role: string = 'MEMBER') => ({
    user: { sub: userId },
    headers: { 'x-org-role': role },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        {
          provide: ResourcesService,
          useValue: mockResourcesService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ResourcesController>(ResourcesController);
    service = module.get(ResourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Infraestrutura Básica', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('Operações de Manutenção', () => {
    it('deve chamar sanitizeDecimals com parâmetros corretos', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      await controller.sanitizeDecimals('org1', req);
      expect(service.sanitizeDecimals).toHaveBeenCalledWith('org1', 'admin123', 'ADMIN');
    });
  });

  describe('Gestão da Equipe do Almoxarifado', () => {
    it('deve buscar a equipe do almoxarifado', async () => {
      await controller.getWarehouseTeam('org1');
      expect(service.getWarehouseTeam).toHaveBeenCalledWith('org1');
    });

    it('deve permitir OWNER alocar membro no almoxarifado', async () => {
      const req = mockRequest('owner123', 'OWNER');
      await controller.assignWarehouseMember('org1', req, 'user456');
      expect(service.assignWarehouseMember).toHaveBeenCalledWith('org1', 'user456');
    });

    it('deve bloquear MEMBER de alocar membro no almoxarifado', async () => {
      const req = mockRequest('member123', 'MEMBER');
      await expect(controller.assignWarehouseMember('org1', req, 'user456'))
        .rejects.toThrow(ForbiddenException);
    });

    it('deve permitir ADMIN remover membro do almoxarifado', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      await controller.removeWarehouseMember('org1', req, 'user456');
      expect(service.removeWarehouseMember).toHaveBeenCalledWith('org1', 'user456');
    });

    it('deve bloquear MEMBER de remover membro do almoxarifado', async () => {
      const req = mockRequest('member123', 'MEMBER');
      await expect(controller.removeWarehouseMember('org1', req, 'user456'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('Operações do Catálogo e Estoque', () => {
    it('deve criar um recurso', async () => {
      const req = mockRequest('user123', 'ADMIN');
      const dto = { name: 'Cimento', type: 'MATERIAL', unit: 'sc', standardCost: 35 } as any;
      await controller.createResource('org1', req, dto);
      expect(service.createResource).toHaveBeenCalledWith('org1', 'user123', 'ADMIN', dto);
    });

    it('deve listar recursos', async () => {
      await controller.listResources('org1');
      expect(service.findAllByOrganization).toHaveBeenCalledWith('org1');
    });

    it('deve solicitar alocação (RM)', async () => {
      const req = mockRequest('user123', 'MEMBER');
      const dto = { resourceId: 'res1', quantity: 10 } as any;
      await controller.requestAllocation('org1', 'proj1', req, dto);
      expect(service.requestAllocation).toHaveBeenCalledWith({
        orgId: 'org1',
        projectId: 'proj1',
        authorId: 'user123',
        resourceId: 'res1',
        quantity: 10,
        origin: undefined,
        attachments: undefined,
      });
    });

    it('deve aprovar requisição (RM)', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      const dto = { approvedQuantity: 10 } as any;
      await controller.approveRequest('org1', 'trans1', req, dto);
      expect(service.approveRequest).toHaveBeenCalledWith('org1', 'trans1', 'admin123', 'ADMIN', 10);
    });

    it('deve rejeitar requisição (RM)', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      const dto = { reason: 'Estoque insuficiente' } as any;
      await controller.rejectRequest('org1', 'trans1', req, dto);
      expect(service.rejectRequest).toHaveBeenCalledWith('org1', 'trans1', 'admin123', 'ADMIN', 'Estoque insuficiente');
    });

    it('deve realizar alocação direta', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      const dto = { resourceId: 'res1', quantity: 5 } as any;
      await controller.allocateDirectly('org1', 'proj1', req, dto);
      expect(service.allocateDirectly).toHaveBeenCalledWith('org1', 'admin123', 'ADMIN', {
        projectId: 'proj1',
        resourceId: 'res1',
        quantity: 5,
        origin: undefined,
        attachments: undefined,
      });
    });

    it('deve adicionar estoque', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      const dto = { resourceId: 'res1', quantity: 100, unitCostSnapshot: 35 } as any;
      await controller.addStock('org1', req, dto);
      expect(service.addStock).toHaveBeenCalledWith('org1', 'admin123', 'ADMIN', dto);
    });

    it('deve retornar recurso do projeto', async () => {
      const req = mockRequest('user123', 'MEMBER');
      const dto = { resourceId: 'res1', quantity: 2 } as any;
      await controller.returnFromProject('org1', 'proj1', req, dto);
      expect(service.returnFromProject).toHaveBeenCalledWith('org1', 'proj1', 'user123', 'MEMBER', dto);
    });

    it('deve cancelar transação', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      const dto = { reason: 'Lançamento indevido' } as any;
      await controller.cancelTransaction('org1', 'trans1', req, dto);
      expect(service.cancelTransaction).toHaveBeenCalledWith('org1', 'trans1', 'admin123', 'ADMIN', 'Lançamento indevido');
    });

    it('deve listar transações', async () => {
      await controller.listTransactions('org1');
      expect(service.listTransactions).toHaveBeenCalledWith('org1');
    });

    it('deve atualizar recurso', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      const dto = { standardCost: 40 };
      await controller.updateResource('org1', 'res1', req, dto);
      expect(service.updateResource).toHaveBeenCalledWith('org1', 'res1', 'admin123', 'ADMIN', dto);
    });

    it('deve inativar recurso', async () => {
      const req = mockRequest('admin123', 'ADMIN');
      await controller.inactivateResource('org1', 'res1', req);
      expect(service.inactivateResource).toHaveBeenCalledWith('org1', 'res1', 'admin123', 'ADMIN');
    });

    it('deve obter extrato do projeto', async () => {
      await controller.getProjectStatement('org1', 'proj1');
      expect(service.getProjectStatement).toHaveBeenCalledWith('org1', 'proj1');
    });
  });
});