import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PlanningService } from './planning.service';
import { ZodValidationPipe } from '../shared/pipe/zod-validation.pipe';
import { searchPlanningSchema as searchSchema, uploadPlanningSchema, SearchPlanningDto, UploadPlanningDto } from './validations/planning.zod';
import { AuthGuard } from 'src/auth/auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('planning')
@UseGuards(AuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService, private readonly configService: ConfigService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ZodValidationPipe(uploadPlanningSchema)) metadata: UploadPlanningDto,
    @Req() req: any
  ) {
    const userEmail = req.user?.email;
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');

    if (userEmail !== superAdminEmail) {
      throw new ForbiddenException('Acesso negado: Área restrita ao Master Admin.');
    }
    return this.planningService.uploadFromExcel(file, metadata);
  }

  @Get('search')
  async search(@Query(new ZodValidationPipe(searchSchema)) query: SearchPlanningDto) {
    return this.planningService.search(query);
  }

  @Get('grouped')
  async grouped(@Query(new ZodValidationPipe(searchSchema)) query: SearchPlanningDto) {
    const groupBy = query.groupBy
      ? query.groupBy.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    return this.planningService.grouped(groupBy, query);
  }

  @Get('composition/:codigoComposicao/items')
  async compositionItems(
    @Param('codigoComposicao') codigoComposicao: string,
    @Query(new ZodValidationPipe(searchSchema)) query: SearchPlanningDto,
  ) {
    return this.planningService.findCompositionItems(codigoComposicao, query);
  }
}
