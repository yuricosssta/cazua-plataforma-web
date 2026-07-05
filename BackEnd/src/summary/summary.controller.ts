//src/summary/summary.controller.ts
import { Controller, HttpCode, HttpStatus, Post, Body, UseGuards, Req } from '@nestjs/common';
import SummaryService from './summary.service';
import { ZodValidationPipe } from '../shared/pipe/zod-validation.pipe';
import { createRellSchema, CreateRellDto } from './validations/summary.zod';
import { AuthGuard } from '../auth/auth.guard';

@Controller('summary')
@UseGuards(AuthGuard)
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) { }

    @HttpCode(HttpStatus.OK)
    @Post('text')
    summarize(@Body('text') text: string): Promise<string> {
        return this.summaryService.summarizeText(text);
    }

    @HttpCode(HttpStatus.OK)
    @Post('reels/generate')
    createRells(
        @Body(new ZodValidationPipe(createRellSchema)) rellDto: CreateRellDto,
        @Req() req: any
    ): Promise<string> {
        const orgId = req.organizationId || req.headers['x-org-id'];
        
        const payload = {
            ...rellDto,
            organizationId: orgId
        };
        
        return this.summaryService.createRells(payload);
    }
}