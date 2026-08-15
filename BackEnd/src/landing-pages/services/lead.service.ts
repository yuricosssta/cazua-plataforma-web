//src/landing-pages/services/lead.service.ts
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeadRepository } from '../repositories/lead.repository';
import { CreateLeadDTO } from '../validations/lead.zod';

@Injectable()
export class LeadService {
  constructor(
    private readonly repository: LeadRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLead(data: CreateLeadDTO) {
    const payload = {
      ...data,
      tenantId: new Types.ObjectId(data.tenantId),
    };

    const lead = await this.repository.create(payload);

    // Dispara evento para notificar a construtora via e-mail ou webhook posteriormente
    this.eventEmitter.emit('lead.created', lead);

    return lead;
  }
}