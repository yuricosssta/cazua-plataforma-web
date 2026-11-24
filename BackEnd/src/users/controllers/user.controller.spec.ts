import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UsersController } from './user.controller';
import { UsersService } from '../services/user.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { SelfOrSuperAdminGuard } from '../guards/self-or-super-admin.guard';
import { OptionalApiClientGuard } from '../../api-clients/guards/optional-api-client.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let app: INestApplication;

  const mockUsersService = {
    getAllUsers: jest.fn(),
    searchUser: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    changeUserPassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SelfOrSuperAdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalApiClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /users', () => {
    it('should create user and normalize email when payload is valid', async () => {
      const createdUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Usuário Público',
        email: 'publico@test.com',
      };
      mockUsersService.createUser.mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuário Público',
          email: '  PUBLICO@Test.com ',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toEqual(createdUser);
      expect(mockUsersService.createUser).toHaveBeenCalledWith({
        name: 'Usuário Público',
        email: 'publico@test.com',
        password: 'password123',
      });
    });

    it('should return 400 when password has fewer than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Usuário Público',
          email: 'publico@test.com',
          password: '1234567',
        })
        .expect(400);

      expect(response.body.message).toContain('Falha na validação: password:');
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });
  });
});
