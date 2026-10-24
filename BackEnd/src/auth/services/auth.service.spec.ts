import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthUsersService } from './auth-users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/user.service';
import { OrganizationService } from '../../organization/services/organization.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockAuthUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    lockAccount: jest.fn(),
    resetLoginAttempts: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@cazua.com';
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockUsersService = {
    createUser: jest.fn(),
    findOne: jest.fn(),
  };

  const mockOrganizationService = {
    linkUserToOrganization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthUsersService, useValue: mockAuthUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: OrganizationService, useValue: mockOrganizationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
