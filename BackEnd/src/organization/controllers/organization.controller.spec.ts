import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from '../services/organization.service';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../auth/guards/auth.guard';

describe('OrganizationController', () => {
  let controller: OrganizationController;

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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        { provide: OrganizationService, useValue: mockOrgService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationController>(OrganizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
