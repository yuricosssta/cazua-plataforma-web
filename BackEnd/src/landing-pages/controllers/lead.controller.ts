//src/landing-pages/controllers/lead.controller.ts
import { Controller, Post, Body, UsePipes, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LeadService } from '../services/lead.service';
import { createLeadSchema } from '../validations/lead.zod';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';

// Rota pública: captura de contatos nas landing pages (anti-spam via rate limiting)
@UseGuards(ThrottlerGuard)
@Controller('leads')
export class LeadController {
  constructor(private readonly service: LeadService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createLeadSchema))
  async create(@Body() body: any) {
    await this.service.createLead(body);
    return { success: true, message: 'Contato recebido com sucesso.' };
  }
}
