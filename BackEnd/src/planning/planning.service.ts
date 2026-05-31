import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import type { Express } from 'express';
import { Planning, PlanningDocument } from './schemas/planning.schema';
import { SearchPlanningDto, UploadPlanningDto } from './validations/planning.zod';

@Injectable()
export class PlanningService {
  constructor(
    @InjectModel(Planning.name)
    private readonly planningModel: Model<PlanningDocument>,
  ) {}

  async uploadFromExcel(file: Express.Multer.File, metadata: UploadPlanningDto) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo Excel não enviado ou inválido.');
    }

    const rows = this.parseWorkbook(file.buffer);
    if (!rows.length) {
      throw new BadRequestException('A planilha não contém linhas válidas.');
    }

    const items = rows
      .map((row) => this.mapRowToPlanning(row, metadata))
      .filter((item) => item.codigoComposicao && item.descricao);

    if (!items.length) {
      throw new BadRequestException('Nenhuma entrada válida foi encontrada na planilha.');
    }

    await this.planningModel.deleteMany(this.buildMetadataFilter(metadata));
    await this.planningModel.insertMany(items);

    return {
      insertedCount: items.length,
      metadata,
    };
  }

  async search(query: SearchPlanningDto) {
    const filters: Record<string, any> = this.buildMetadataFilter(query as UploadPlanningDto);

    if (query.grupo) filters.grupo = query.grupo;
    if (query.codigoComposicao) filters.codigoComposicao = query.codigoComposicao;
    if (query.tipo) filters.tipo = query.tipo;
    if (query.insumo) filters.insumo = query.insumo;
    if (query.summaryOnly !== undefined) filters.isSummary = query.summaryOnly;

    const filtersWithSearch = { ...filters };
    if (query.q) {
      filtersWithSearch.$text = { $search: query.q };
    }

    const searchQuery = this.planningModel.find(filtersWithSearch);
    const page = Math.max(query.page, 1);
    const limit = Math.min(Math.max(query.limit, 1), 100);

    const [items, total] = await Promise.all([
      searchQuery
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.planningModel.countDocuments(filtersWithSearch),
    ]);

    return {
      page,
      limit,
      total,
      items,
    };
  }

  async findCompositionItems(codigoComposicao: string, query: SearchPlanningDto = {}) {
    const filters: Record<string, any> = this.buildMetadataFilter(query as UploadPlanningDto);
    filters.codigoComposicao = codigoComposicao;

    if (query.state) filters.state = query.state;
    if (query.referenceMonth) filters.referenceMonth = query.referenceMonth;
    if (query.referenceYear) filters.referenceYear = query.referenceYear;
    if (query.organizationId) filters.organizationId = query.organizationId;
    if (query.isGlobal !== undefined) filters.isGlobal = query.isGlobal;

    return this.planningModel.find(filters).sort({ isSummary: -1, descricao: 1 }).lean();
  }

  async grouped(groupBy: string[], query: SearchPlanningDto = {}) {
    const filters: Record<string, any> = this.buildMetadataFilter(query as UploadPlanningDto);

    if (query.q) {
      filters.$text = { $search: query.q };
    }
    if (query.grupo) filters.grupo = query.grupo;
    if (query.codigoComposicao) filters.codigoComposicao = query.codigoComposicao;
    if (query.tipo) filters.tipo = query.tipo;
    if (query.insumo) filters.insumo = query.insumo;
    if (query.summaryOnly !== undefined) filters.isSummary = query.summaryOnly;

    if (!groupBy.length) {
      groupBy = ['state', 'referenceYear', 'referenceMonth', 'grupo'];
    }

    const groupObject = groupBy.reduce((acc, key) => {
      acc[key] = `$${key}`;
      return acc;
    }, {} as Record<string, string>);

    const pipeline: any[] = [
      { $match: filters },
      {
        $group: {
          _id: groupObject,
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          ...groupBy.reduce((acc, key) => {
            acc[key] = `$_id.${key}`;
            return acc;
          }, {} as Record<string, string>),
        },
      },
      { $sort: { state: 1, referenceYear: 1, referenceMonth: 1, grupo: 1 } },
    ];

    return this.planningModel.aggregate(pipeline as any);
  }

  private buildMetadataFilter(metadata: Partial<UploadPlanningDto>) {
    const filter: Record<string, any> = {};

    if (metadata.isGlobal !== undefined) filter.isGlobal = metadata.isGlobal;
    if (metadata.organizationId !== undefined) filter.organizationId = metadata.organizationId;
    if (metadata.state) filter.state = metadata.state;
    if (metadata.referenceMonth !== undefined) filter.referenceMonth = metadata.referenceMonth;
    if (metadata.referenceYear !== undefined) filter.referenceYear = metadata.referenceYear;

    return filter;
  }

  private parseWorkbook(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  }

  private mapRowToPlanning(row: Record<string, any>, metadata: UploadPlanningDto) {
    const normalized = this.normalizeRow(row);
    const codigoComposicao = String(normalized.composicao || normalized.codigoComposicao || '').trim();
    const grupo = String(normalized.grupo || '').trim();
    const tipo = String(normalized.tipo || '').trim();
    const insumo = String(normalized.insumo || '').trim();
    const descricao = String(normalized.descricao || '').trim();
    const unidade = String(normalized.unidade || '').trim();
    const custo = String(normalized.custo || '').trim();

    const rawCoeficiente = String(normalized.coeficiente ?? '').replace(',', '.').trim();
    const coeficiente = rawCoeficiente.length > 0 ? Number(rawCoeficiente) : null;

    const isSummary = !insumo || tipo.toUpperCase() === 'COMPOSICAO' || tipo === '';

    return {
      ...metadata,
      grupo,
      codigoComposicao,
      tipo,
      insumo,
      descricao,
      unidade,
      coeficiente: Number.isFinite(coeficiente) ? coeficiente : null,
      custo,
      isSummary,
    };
  }

  private normalizeRow(row: Record<string, any>) {
    return Object.keys(row).reduce((acc, key) => {
      const normalizedKey = key
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toLowerCase();
      acc[normalizedKey] = row[key];
      return acc;
    }, {} as Record<string, any>);
  }
}
