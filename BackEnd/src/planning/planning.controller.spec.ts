import { Test, TestingModule } from '@nestjs/testing';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';

describe('PlanningController', () => {
  let controller: PlanningController;
  let service: PlanningService;

  const mockPlanningService = {
    uploadFromExcel: jest.fn(),
    search: jest.fn(),
    grouped: jest.fn(),
    findCompositionItems: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanningController],
      providers: [
        {
          provide: PlanningService,
          useValue: mockPlanningService,
        },
      ],
    }).compile();

    controller = module.get<PlanningController>(PlanningController);
    service = module.get<PlanningService>(PlanningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadExcel', () => {
    it('should delegate upload to the service', async () => {
      const file = { buffer: Buffer.from('test') } as Express.Multer.File;
      const metadata = {
        isGlobal: true,
        organizationId: null,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
      };
      const expected = { insertedCount: 1, metadata };
      mockPlanningService.uploadFromExcel.mockResolvedValue(expected);

      const result = await controller.uploadExcel(file, metadata as any);

      expect(result).toEqual(expected);
      expect(service.uploadFromExcel).toHaveBeenCalledWith(file, metadata);
    });
  });

  describe('search', () => {
    it('should return search results from the service', async () => {
      const query = { q: 'PISO', page: 1, limit: 10 };
      const expected = { items: [], total: 0, page: 1, limit: 10 };
      mockPlanningService.search.mockResolvedValue(expected);

      const result = await controller.search(query as any);

      expect(result).toEqual(expected);
      expect(service.search).toHaveBeenCalledWith(query);
    });
  });

  describe('grouped', () => {
    it('should return grouped results from the service', async () => {
      const query = { groupBy: 'state,grupo' };
      const expected = [{ state: 'MG', grupo: 'Acessibilidade', count: 3 }];
      mockPlanningService.grouped.mockResolvedValue(expected);

      const result = await controller.grouped(query as any);

      expect(result).toEqual(expected);
      expect(service.grouped).toHaveBeenCalledWith(['state', 'grupo'], query);
    });
  });

  describe('compositionItems', () => {
    it('should return composition items from the service', async () => {
      const expected = [{ codigoComposicao: '104658' }];
      mockPlanningService.findCompositionItems.mockResolvedValue(expected);

      const result = await controller.compositionItems('104658', {} as any);

      expect(result).toEqual(expected);
      expect(service.findCompositionItems).toHaveBeenCalledWith('104658', {});
    });
  });
});
