import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

@Injectable()
export class SelfOrSuperAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { userId } = request.params;

    if (!user) {
      throw new ForbiddenException('Acesso negado: Usuário não autenticado.');
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuário inválido.');
    }

    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const isSuperAdmin =
      user.isSuperAdmin === true ||
      (superAdminEmail && user.email?.toLowerCase() === superAdminEmail.toLowerCase());

    const isSelf = String(user.sub || user.userId || user.id) === String(userId);

    if (!isSelf && !isSuperAdmin) {
      throw new ForbiddenException(
        'Acesso negado: Você só pode acessar ou modificar sua própria conta.',
      );
    }

    return true;
  }
}
