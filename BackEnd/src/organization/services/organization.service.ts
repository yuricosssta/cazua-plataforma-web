// src/organization/services/organization.service.ts

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    private usersService: UsersService
  ) { }

  // 1. CRIAÇÃO E VÍNCULO AUTOMÁTICO
  async create(createDto: CreateOrganizationDto, ownerId: string) {

    // 1. Busca todas as empresas onde este usuário é o DONO
    const ownedMemberships = await this.memberModel.find({
      userId: new Types.ObjectId(ownerId),
      role: 'OWNER'
    }).exec();

    // Se ele já for dono de alguma empresa, precisamos verificar se ele tem o plano ENTERPRISE
    if (ownedMemberships.length >= 1) {
      const ownedOrgIds = ownedMemberships.map(m => m.organizationId);

      // Busca quantas empresas que ele é dono possuem o plano ENTERPRISE
      const enterpriseOrgsCount = await this.orgModel.countDocuments({
        _id: { $in: ownedOrgIds },
        plan: 'ENTERPRISE'
      });

      // Se NENHUMA empresa dele for ENTERPRISE, bloqueia a criação de novas.
      if (enterpriseOrgsCount === 0) {
        throw new BadRequestException('LIMITE_FREE_EXCEDIDO: Você atingiu o limite de 1 empresa por conta. Faça o upgrade para o plano ENTERPRISE para criar e gerenciar múltiplas empresas.');
      }
    }

    const slug = createDto.slug || this.generateSlug(createDto.name);

    const existing = await this.orgModel.findOne({ slug });
    if (existing) {
      throw new BadRequestException('Este endereço (URL) ou sigla já está em uso.');
    }

    const createdOrg = new this.orgModel({
      ...createDto,
      slug,
      ownerId: new Types.ObjectId(ownerId),
      plan: 'FREE' // Toda nova empresa nasce no Free por padrão
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

  async updateMemberRole(orgId: string, adminId: string, targetUserId: string, newRole: string) {
    // Verifica se quem está pedindo é ADMIN ou OWNER
    const adminMember = await this.memberModel.findOne({
      organizationId: new Types.ObjectId(String(orgId)),
      userId: new Types.ObjectId(String(adminId)),
      role: { $in: ['ADMIN', 'OWNER'] }
    });

    if (!adminMember) {
      throw new ForbiddenException('Apenas administradores podem alterar cargos.');
    }

    // Atualiza o cargo do alvo
    const updated = await this.memberModel.findOneAndUpdate(
      {
        organizationId: new Types.ObjectId(String(orgId)),
        userId: new Types.ObjectId(String(targetUserId))
      },
      { role: newRole },
      { new: true }
    );

    if (!updated) throw new NotFoundException('Membro não encontrado nesta organização.');
    return { message: 'Cargo atualizado com sucesso.' };
  }

  async removeMemberFromOrganization(orgId: string, adminId: string, targetUserId: string) {
    // Verifica se quem está pedindo é ADMIN ou OWNER
    const adminMember = await this.memberModel.findOne({
      organizationId: new Types.ObjectId(String(orgId)),
      userId: new Types.ObjectId(String(adminId)),
      role: { $in: ['ADMIN', 'OWNER'] }
    });

    if (!adminMember) {
      throw new ForbiddenException('Apenas administradores podem remover membros.');
    }

    if (adminId === targetUserId) {
      throw new BadRequestException('Você não pode remover a si mesmo por aqui.');
    }

    // Remove o vínculo
    await this.memberModel.findOneAndDelete({
      organizationId: new Types.ObjectId(String(orgId)),
      userId: new Types.ObjectId(String(targetUserId)),
      role: { $ne: 'OWNER' } // Proteção extra: não deixa deletar o dono supremo
    });

    return { message: 'Membro removido da organização.' };
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

  async findAllForSuperAdmin(): Promise<Organization[]> {
    // Busca todas as organizações com o dono populado
    const orgs = await this.orgModel
      .find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .lean() // O lean() transforma o Documento Mongoose em um Objeto JS
      .exec();

    // 2. Extrai uma lista única com todos os IDs dos donos
    const ownerIds = [...new Set(orgs.map(org => org.ownerId?._id).filter(Boolean))];

    // 3. Busca TODAS as participações (memberships) desses donos na plataforma inteira
    const allMemberships = await this.memberModel
      .find({ userId: { $in: ownerIds as any[] } })
      .populate('organizationId', 'name acronym plan')
      .lean()
      .exec();

    // 4. Agrupa as participações por ID do usuário para busca rápida (O(1))
    const membershipsByUser = allMemberships.reduce((acc, membership) => {
      const uid = String(membership.userId);
      if (!acc[uid]) acc[uid] = [];
      acc[uid].push(membership);
      return acc;
    }, {} as Record<string, any[]>);

    // 5. Injeta o currículo completo de empresas de volta no array original
    return orgs.map(org => {
      const ownerIdStr = org.ownerId ? String((org.ownerId as any)._id) : null;
      return {
        ...org,
        ownerMemberships: ownerIdStr ? (membershipsByUser[ownerIdStr] || []) : []
      };
    });
  }

  // Altera o plano de qualquer empresa
  async updatePlan(orgId: string, newPlan: string) {
    if (!['FREE', 'PRO', 'ENTERPRISE'].includes(newPlan)) {
      throw new BadRequestException('Plano inválido.');
    }

    const org = await this.orgModel.findByIdAndUpdate(
      orgId,
      { plan: newPlan },
      { new: true }
    );

    if (!org) throw new BadRequestException('Organização não encontrada.');
    return org;
  }

}