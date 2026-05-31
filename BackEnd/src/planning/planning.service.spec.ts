import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as XLSX from 'xlsx';
import { PlanningService } from './planning.service';
import { Planning } from './schemas/planning.schema';

describe('PlanningService', () => {
  let service: PlanningService;
  let mockModel: any;

  const mockQuery = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn(). mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    mockModel = {
      deleteMany: jest.fn().mockResolvedValue({}),
      insertMany: jest.fn().mockResolvedValue([]),
      find: jest.fn().mockReturnValue(mockQuery),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanningService,
        {
          provide: getModelToken(Planning.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<PlanningService>(PlanningService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFromExcel', () => {
    it('should parse excel and insert planning rows', async () => {
      const workbook = XLSX.utils.book_new();
      const rows = [
        {
          grupo: 'Acessibilidade',
          composicao: '104658',
          tipo: 'COMPOSICAO',
          insumo: '88316',
          descricao: 'SERVENTE COM ENCARGOS COMPLEMENTARES',
          unidade: 'H',
          coeficiente: '1.279',
          custo: 'COM CUSTO',
        },
        {
          grupo: 'Acessibilidade',
          composicao: '104658',
          tipo: 'INSUMO',
          insumo: '36178',
          descricao: 'PISO TATIL / PODOTATIL...',
          unidade: 'UN',
          coeficiente: '6.4375',
          custo: 'COM PREÇO',
        },
      ];
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      const metadata = {
        isGlobal: true,
        organizationId: null,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
      };

      const result = await service.uploadFromExcel({ buffer } as Express.Multer.File, metadata);

      expect(mockModel.deleteMany).toHaveBeenCalledWith(metadata);
      expect(mockModel.insertMany).toHaveBeenCalledTimes(1);
      expect(result.insertedCount).toBe(2);
      const insertedItems = mockModel.insertMany.mock.calls[0][0];
      expect(insertedItems[0]).toMatchObject({
        grupo: 'Acessibilidade',
        codigoComposicao: '104658',
        tipo: 'COMPOSICAO',
        insumo: '88316',
        descricao: 'SERVENTE COM ENCARGOS COMPLEMENTARES',
        unidade: 'H',
        coeficiente: 1.279,
        custo: 'COM CUSTO',
        isSummary: true,
      });
      expect(insertedItems[1]).toMatchObject({
        tipo: 'INSUMO',
        insumo: '36178',
        isSummary: false,
      });
    });
  });

  describe('search', () => {
    it('should return paginated search results and apply text search', async () => {
      const expectedItems = [{ descricao: 'PISO TATIL' }];
      mockQuery.lean.mockResolvedValue(expectedItems);
      mockModel.countDocuments.mockResolvedValue(1);

      const result = await service.search({
        q: 'PISO',
        isGlobal: true,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
        page: 1,
        limit: 10,
      } as any);

      expect(mockModel.find).toHaveBeenCalledWith({
        isGlobal: true,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
        $text: { $search: 'PISO' },
      });
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        items: expectedItems,
      });
    });
  });

  describe('findCompositionItems', () => {
    it('should filter items by composition code and metadata', async () => {
      const expectedItems = [{ codigoComposicao: '104658' }];
      const compositionQuery = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(expectedItems),
      } as any;
      mockModel.find.mockReturnValueOnce(compositionQuery);

      const result = await service.findCompositionItems('104658', {
        isGlobal: true,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
      } as any);

      expect(mockModel.find).toHaveBeenCalledWith({
        isGlobal: true,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
        codigoComposicao: '104658',
      });
      expect(compositionQuery.sort).toHaveBeenCalledWith({ isSummary: -1, descricao: 1 });
      expect(result).toEqual(expectedItems);
    });
  });

  describe('grouped', () => {
    it('should return grouping results using aggregation pipeline', async () => {
      const aggregateResult = [
        {
          state: 'MG',
          referenceYear: 2025,
          referenceMonth: 6,
          grupo: 'Acessibilidade',
          count: 2,
        },
      ];
      mockModel.aggregate.mockResolvedValueOnce(aggregateResult);

      const result = await service.grouped([], {
        q: 'PISO',
        isGlobal: true,
        state: 'MG',
        referenceMonth: 6,
        referenceYear: 2025,
      } as any);

      expect(mockModel.aggregate).toHaveBeenCalled();
      expect(result).toEqual(aggregateResult);
    });
  });
});
