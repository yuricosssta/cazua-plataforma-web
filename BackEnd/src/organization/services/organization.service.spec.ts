import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OrganizationService } from '../services/organization.service';
import { Organization } from '../schemas/organization.schema';
import { OrganizationMember } from '../schemas/organization-member.schema';
import { UsersService } from '../../users/services/user.service';
import { ConfigService } from '@nestjs/config';

describe('OrganizationService', () => {
  let service: OrganizationService;

  const mockOrgModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockMemberModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    createUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: getModelToken(Organization.name), useValue: mockOrgModel },
        {
          provide: getModelToken(OrganizationMember.name),
          useValue: mockMemberModel,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
