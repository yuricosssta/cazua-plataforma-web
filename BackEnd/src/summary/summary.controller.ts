//src/summary/summary.controller.ts
import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import SummaryService from './summary.service';
import { ZodValidationPipe } from '../shared/pipe/zod-validation.pipe';
import { createReelSchema, CreateReelDto } from './validations/summary.zod';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('summary')
@UseGuards(AuthGuard)
export class SummaryController {
  constructor(private readonly summaryService: SummaryService) {}

  @HttpCode(HttpStatus.OK)
  @Post('text')
  summarize(@Body('text') text: string): Promise<string> {
    return this.summaryService.summarizeText(text);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reels/generate')
  createReels(
    @Body(new ZodValidationPipe(createReelSchema)) ReelDto: CreateReelDto,
    @Req() req: any,
  ): Promise<string> {
    const orgId = req.organizationId || req.headers['x-org-id'];

    const payload = {
      ...ReelDto,
      organizationId: orgId,
    };

    return this.summaryService.createReels(payload);
  }
}
