// src/organization/services/organization.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/organization.schema';
import { OrganizationMember, OrganizationMemberDocument } from '../schemas/organization-member.schema';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UsersService } from '../../users/services/user.service';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(OrganizationMember.name) private memberModel: Model<OrganizationMemberDocument>,
    private usersService: UsersService // <-- INJEÇÃO DO SERVIÇO DE USUÁRIOS
  ) { }

  // 1. CRIAÇÃO E VÍNCULO AUTOMÁTICO
  async create(createDto: CreateOrganizationDto, ownerId: string) {
    const slug = createDto.slug || this.generateSlug(createDto.name);

    const existing = await this.orgModel.findOne({ slug });
    if (existing) {
      throw new BadRequestException('Este endereço (URL) já está em uso.');
    }

    const createdOrg = new this.orgModel({
      ...createDto,
      slug,
      ownerId: new Types.ObjectId(ownerId),
    });
    const savedOrg = await createdOrg.save();

    await this.memberModel.create({
      organizationId: savedOrg._id,
      userId: new Types.ObjectId(ownerId),
      role: 'OWNER',
    });

    return savedOrg;
  }

  // 2. LISTAGEM (O Menu Lateral)
  async findAllForUser(userId: string) {
    const memberships = await this.memberModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'organizationId',
        select: 'name slug ownerId status createdAt',
      })
      .exec();

    return memberships;
  }

  // 3. BUSCAR MEMBROS DA ORGANIZAÇÃO
  async findMembersByOrganization(orgId: string) {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new BadRequestException('ID da organização inválido ou não fornecido.');
    }

    const memberships = await this.memberModel
      .find({ organizationId: new Types.ObjectId(orgId) })
      .populate({
        path: 'userId', 
        select: 'name email', 
      })
      .exec();

    return memberships
      .filter(m => m.userId) 
      .map(m => {
        const user = m.userId as any;
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          membership: {
            organizationId: m.organizationId,
            role: m.role,
          },
        };
      });
  }

  // --- NOVO: A LÓGICA DE CADASTRO SAAS B2B ---
  async addMemberToOrganization(orgId: string, userData: any) {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new BadRequestException('ID da organização inválido.');
    }

    let user;
    
    // 1. Verifica se a Identidade Global já existe
    user = await this.usersService.findOne(userData.email);

    // 2. Se não existir, cria a nova conta global
    if (!user) {
      try {
        // Chamamos a criação global (que apenas cria o User com name, email e password)
        user = await this.usersService.createUser({
          name: userData.name,
          email: userData.email,
          password: userData.password,
        });
      } catch (error) {
        throw new BadRequestException('Erro ao criar o usuário base.');
      }
    }

    // 3. Valida se o usuário já não faz parte DESTA empresa
    const existingLink = await this.memberModel.findOne({
      organizationId: new Types.ObjectId(orgId),
      userId: new Types.ObjectId(String(user._id || user.id)),
    });

    if (existingLink) {
      throw new BadRequestException('Este usuário já é membro desta equipe.');
    }

    // 4. Cria o vínculo na tabela pivô oficial
    await this.memberModel.create({
      organizationId: new Types.ObjectId(orgId),
      userId: new Types.ObjectId(String(user._id || user.id)),
      role: userData.role || 'MEMBER',
    });

    return { message: 'Membro adicionado com sucesso!' };
  }

  // 4. BUSCA POR SLUG
  async findOneBySlug(slug: string) {
    const org = await this.orgModel.findOne({ slug }).exec();
    if (!org) throw new BadRequestException('Organização não encontrada');
    return org;
  }

  // Helper simples para gerar slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  }
}