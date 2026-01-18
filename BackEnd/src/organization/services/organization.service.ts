import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, OrganizationDocument } from  '../schemas/organization.schema';
import { OrganizationMember, OrganizationMemberDocument } from '../schemas/organization-member.schema';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMember.name) private memberModel: Model<OrganizationMemberDocument>,
  ) {}

  // 1. CRIAÇÃO E VÍNCULO AUTOMÁTICO
  async create(createDto: CreateOrganizationDto, ownerId: string) {
    // A. Gera o slug se não vier (ex: "Minha Empresa" -> "minha-empresa")
    const slug = createDto.slug || this.generateSlug(createDto.name);

    // B. Verifica duplicidade
    const existing = await this.orgModel.findOne({ slug });
    if (existing) {
      throw new BadRequestException('Este endereço (URL) já está em uso.');
    }

    // C. Cria a Organização
    const createdOrg = new this.orgModel({
      ...createDto,
      slug,
      ownerId: new Types.ObjectId(ownerId),
    });
    const savedOrg = await createdOrg.save();

    // D. CRUCIAL: Cria o vínculo de OWNER imediatamente
    await this.memberModel.create({
      organizationId: savedOrg._id,
      userId: new Types.ObjectId(ownerId),
      role: 'OWNER',
    });

    return savedOrg;
  }

  // 2. LISTAGEM (O Menu Lateral)
  async findAllForUser(userId: string) {
    // Busca na tabela de MEMBROS, filtrando pelo usuário
    const memberships = await this.memberModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'organizationId',
        select: 'name slug ownerId status createdAt', // Campos que deseja na organização
      })
      .exec();

    // Retorna a lista de vínculos (que contém a empresa dentro)
    return memberships;
  }

  // 3. BUSCA POR SLUG (Validação de Rota)
  async findOneBySlug(slug: string) {
    const org = await this.orgModel.findOne({ slug }).exec();
    if (!org) throw new BadRequestException('Organização não encontrada');
    return org;
  }

  // Helper simples para gerar slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-'); // Troca espaços por hifens
  }
}