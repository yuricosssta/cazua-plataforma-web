//src/modules/landing-page/landing-page-config.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LandingPageConfig } from '../schemas/landing-page-config.schema';

@Injectable()
export class LandingPageConfigRepository {
  constructor(
    @InjectModel(LandingPageConfig.name)
    private readonly configModel: Model<LandingPageConfig>,
  ) {}

  async findByDomain(domain: string): Promise<LandingPageConfig | null> {
    return this.configModel.findOne({ domain, isActive: true }).exec();
  }

  async create(data: Partial<LandingPageConfig>): Promise<LandingPageConfig> {
    const newConfig = new this.configModel(data);
    return newConfig.save();
  }

  async update(tenantId: Types.ObjectId, data: Partial<LandingPageConfig>): Promise<LandingPageConfig | null> {
    return this.configModel
      .findOneAndUpdate({ tenantId, isActive: true }, { $set: data }, { new: true })
      .exec();
  }

  async softDelete(tenantId: Types.ObjectId): Promise<void> {
    await this.configModel.updateOne({ tenantId }, { $set: { isActive: false } }).exec();
  }
}