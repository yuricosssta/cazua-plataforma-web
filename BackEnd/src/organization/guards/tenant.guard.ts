import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganizationMember, OrganizationMemberDocument } from '../schemas/organization-member.schema';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(OrganizationMember.name)
    private memberModel: Model<OrganizationMemberDocument>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (!user.sub && !user.userId)) {
      console.error('TenantGuard: Usuário não encontrado no request. Verifique se o AuthGuard foi executado.');
      throw new ForbiddenException('Usuário não autenticado.');
    }
    const userIdStr = user.sub || user.userId;


    if (!Types.ObjectId.isValid(userIdStr)) {
      console.error('TenantGuard: ID do usuário no token não é um ObjectId válido:', userIdStr);
      throw new UnauthorizedException('Token de usuário inválido.');
    }

    const orgIdHeader = request.headers['x-org-id'];
    if (!orgIdHeader) {
      throw new BadRequestException('O cabeçalho x-org-id é obrigatório.');
    }

    if (!Types.ObjectId.isValid(orgIdHeader)) {
      throw new BadRequestException(`ID da organização inválido: ${orgIdHeader}`);
    }

    const membership = await this.memberModel.findOne({
      userId: new Types.ObjectId(userIdStr),
      organizationId: new Types.ObjectId(orgIdHeader),
    }).exec();

    if (!membership) {
      throw new ForbiddenException('Acesso negado a esta organização.');
    }

    request['organizationId'] = membership.organizationId.toString();
    request['userRole'] = membership.role; // Útil para verificar se é ADMIN depois

    return true;
  }
}