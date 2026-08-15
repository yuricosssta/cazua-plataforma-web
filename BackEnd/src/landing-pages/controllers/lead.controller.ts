//src/landing-pages/controllers/lead.controller.ts
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { LeadService } from '../services/lead.service';
import { createLeadSchema } from '../validations/lead.zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

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