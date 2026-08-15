//src/landing-pages/repositories/lead.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from '../schemas/lead.schema';

@Injectable()
export class LeadRepository {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<Lead>,
  ) {}

  async create(data: Partial<Lead>): Promise<Lead> {
    const newLead = new this.leadModel(data);
    return newLead.save();
  }
}