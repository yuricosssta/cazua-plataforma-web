//src/organization/guards/tenant.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OrganizationMember,
  OrganizationMemberDocument,
} from '../schemas/organization-member.schema';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(OrganizationMember.name)
    private readonly memberModel: Model<OrganizationMemberDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (!user.sub && !user.userId)) {
      throw new ForbiddenException(
        'Usuário não autenticado. Execute o AuthGuard primeiro.',
      );
    }

    const userIdStr = user.sub || user.userId;

    if (!Types.ObjectId.isValid(userIdStr)) {
      throw new UnauthorizedException('ID de usuário inválido no token.');
    }

    const orgIdHeader = request.headers['x-org-id'];
    if (!orgIdHeader) {
      throw new BadRequestException(
        'O cabeçalho x-org-id é obrigatório para esta rota.',
      );
    }

    if (!Types.ObjectId.isValid(orgIdHeader as string)) {
      throw new BadRequestException('ID da organização malformado.');
    }

    const organizationId = new Types.ObjectId(orgIdHeader as string);
    const userId = new Types.ObjectId(userIdStr as string);

    const membership = await this.memberModel
      .findOne({
        userId,
        organizationId,
      })
      .exec();

    if (!membership) {
      throw new ForbiddenException(
        'Acesso negado a esta organização ou associação inativa.',
      );
    }

    request['organizationId'] = membership.organizationId.toString();
    request['userRole'] = membership.role;

    return true;
  }
}
