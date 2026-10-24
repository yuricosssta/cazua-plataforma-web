import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Acesso negado: Usuário não autenticado.');
    }

    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const isSuperAdmin =
      user.isSuperAdmin === true ||
      (superAdminEmail &&
        user.email?.toLowerCase() === superAdminEmail.toLowerCase());

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Acesso negado: Área restrita ao Super Administrador.',
      );
    }

    return true;
  }
}
