//src/landing-pages/services/landing-page-config.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { LandingPageConfigService } from './landing-page-config.service';
import { LandingPageConfigRepository } from '../repositories/landing-page-config.repository';
import { LandingPageConfig } from '../schemas/landing-page-config.schema';

describe('LandingPageConfigService', () => {
  let service: LandingPageConfigService;
  let repository: jest.Mocked<Partial<LandingPageConfigRepository>>;

  const orgId = new Types.ObjectId().toString();

  const validData: any = {
    domain: '  Construtora.Com.BR  ',
    name: 'Construtora',
    heroTitle: 'Título de Impacto',
    heroSubtitle: 'Subtítulo descritivo da construtora',
    theme: { primaryHSL: '210 100% 50%' },
    isActive: true,
  };

  beforeEach(async () => {
    repository = {
      findByDomain: jest.fn(),
      findByOrganizationId: jest.fn(),
      findConflictingDomain: jest.fn(),
      upsert: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandingPageConfigService,
        { provide: LandingPageConfigRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<LandingPageConfigService>(LandingPageConfigService);
  });

  describe('getConfigByDomain', () => {
    it('retorna a config quando o domínio existe', async () => {
      const config = {
        domain: 'construtora.com.br',
        isActive: true,
      } as LandingPageConfig;
      (repository.findByDomain as jest.Mock).mockResolvedValue(config);

      await expect(
        service.getConfigByDomain('construtora.com.br'),
      ).resolves.toBe(config);
    });

    it('lança NotFoundException quando não existe', async () => {
      (repository.findByDomain as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getConfigByDomain('inexistente.com.br'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getConfigByOrgId', () => {
    it('lança NotFoundException quando a org não tem config', async () => {
      (repository.findByOrganizationId as jest.Mock).mockResolvedValue(null);

      await expect(service.getConfigByOrgId(orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('upsertConfig', () => {
    it('normaliza o domínio antes de persistir', async () => {
      (repository.findConflictingDomain as jest.Mock).mockResolvedValue(null);
      (repository.upsert as jest.Mock).mockResolvedValue({
        domain: 'construtora.com.br',
      });

      await service.upsertConfig(orgId, validData);

      expect(repository.findConflictingDomain).toHaveBeenCalledWith(
        'construtora.com.br',
        expect.any(Types.ObjectId),
      );
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        expect.objectContaining({ domain: 'construtora.com.br' }),
      );
    });

    it('lança ConflictException quando o domínio pertence a outra organização (ativa ou inativa)', async () => {
      (repository.findConflictingDomain as jest.Mock).mockResolvedValue({
        domain: 'construtora.com.br',
        isActive: false,
      });

      await expect(
        service.upsertConfig(orgId, validData),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('disableConfig', () => {
    it('aplica soft delete', async () => {
      await service.disableConfig(orgId);
      expect(repository.softDelete).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
      );
    });
  });
});
