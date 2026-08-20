//src/landing-pages/services/lead.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LeadRepository } from '../repositories/lead.repository';
import { CreateLeadDTO } from '../validations/lead.zod';
import { OrganizationService } from '../../organization/services/organization.service';

@Injectable()
export class LeadService {
  constructor(
    private readonly repository: LeadRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly organizationService: OrganizationService,
  ) {}

  async createLead(data: CreateLeadDTO) {
    const organizationId = new Types.ObjectId(data.organizationId);

    // Valida que a organização de destino realmente existe (integridade / anti-spam de tenant inexistente)
    const orgExists = await this.organizationService.existsById(organizationId);
    if (!orgExists) {
      throw new NotFoundException(
        'Organização não encontrada para este contato.',
      );
    }

    const payload = {
      ...data,
      organizationId,
    };

    const lead = await this.repository.create(payload);

    // Dispara evento para notificar a construtora via e-mail ou webhook posteriormente
    this.eventEmitter.emit('lead.created', lead);

    return lead;
  }
}
