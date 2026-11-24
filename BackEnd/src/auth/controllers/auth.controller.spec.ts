import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiClientGuard } from '../../api-clients/guards/api-client.guard';
import { AuthGuard } from '../guards/auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let app: INestApplication;

  const orgId = '507f1f77bcf86cd799439099';
  const mockApiClient = {
    _id: '507f1f77bcf86cd799439088',
    name: 'App Externa',
    allowedOrgIds: [orgId],
    defaultRole: 'MEMBER',
  };

  const mockAuthService = {
    signIn: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ApiClientGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.apiClient = mockApiClient;
          return true;
        },
      })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/register', () => {
    it('should register external user with valid payload and apiClient', async () => {
      const expectedResult = {
        user: {
          _id: '507f1f77bcf86cd799439012',
          name: 'Usuário Externo',
          email: 'externo@test.com',
          isActive: true,
        },
        access_token: 'jwt-token',
        linked: false,
      };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Usuário Externo',
          email: 'EXTERNO@Test.com',
          password: 'password123',
          orgId,
        })
        .expect(201);

      expect(response.body).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        {
          name: 'Usuário Externo',
          email: 'externo@test.com',
          password: 'password123',
          orgId,
        },
        mockApiClient,
      );
    });

    it('should return 400 when payload is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Usuário Externo',
          email: 'invalid-email',
          password: '123',
          orgId: 'not-an-object-id',
        })
        .expect(400);

      expect(response.body.message).toContain('Falha na validação:');
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });
  });
});
