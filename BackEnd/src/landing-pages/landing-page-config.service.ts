//src/modules/landing-page/landing-page-config.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { LandingPageConfigRepository } from './repositories/landing-page-config.repository';

@Injectable()
export class LandingPageConfigService {
  constructor(private readonly repository: LandingPageConfigRepository) {}

  async getConfigByDomain(domain: string) {
    const config = await this.repository.findByDomain(domain);
    if (!config) {
      throw new NotFoundException(`Configuração não encontrada para o domínio: ${domain}`);
    }
    return config;
  }

  async createConfig(data: any) {
    const payload = {
      ...data,
      tenantId: new Types.ObjectId(data.tenantId),
    };
    return this.repository.create(payload);
  }

  async disableConfig(tenantIdString: string) {
    const tenantId = new Types.ObjectId(tenantIdString);
    await this.repository.softDelete(tenantId);
  }
}