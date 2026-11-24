import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from '../services/organization.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../auth/guards/auth.guard';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let app: INestApplication;

  const mockUser = {
    sub: '507f1f77bcf86cd799439011',
    email: 'admin@test.com',
  };

  const mockOrgService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findMembersByOrganization: jest.fn(),
    addMemberToOrganization: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMemberFromOrganization: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<OrganizationController>(OrganizationController);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /organizations/:orgId/members', () => {
    const orgId = '507f1f77bcf86cd799439099';

    it('should validate only the body and add member successfully', async () => {
      mockOrgService.addMemberToOrganization.mockResolvedValue({
        message: 'Membro adicionado com sucesso!',
      });

      const response = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/members`)
        .send({
          name: 'Novo Colaborador',
          email: 'COLAB@Test.com',
          password: 'password123',
          role: 'MEMBER',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Membro adicionado com sucesso!',
      });
      expect(mockOrgService.addMemberToOrganization).toHaveBeenCalledWith(
        orgId,
        mockUser,
        {
          name: 'Novo Colaborador',
          email: 'colab@test.com',
          password: 'password123',
          role: 'MEMBER',
        },
      );
    });

    it('should return 400 when password has fewer than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post(`/organizations/${orgId}/members`)
        .send({
          name: 'Novo Colaborador',
          email: 'colab@test.com',
          password: '123',
          role: 'MEMBER',
        })
        .expect(400);

      expect(response.body.message).toContain('Falha na validação: password:');
      expect(mockOrgService.addMemberToOrganization).not.toHaveBeenCalled();
    });
  });
});
