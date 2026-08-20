//src/landing-pages/guards/landing-page-role.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

// Papéis autorizados a mutar a landing page (leitura permanece liberada a qualquer membro)
const ALLOWED_ROLES = ['OWNER', 'ADMIN'];

@Injectable()
export class LandingPageRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userRole = request.userRole;

    if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
      throw new ForbiddenException(
        'Apenas OWNER ou ADMIN podem editar a Landing Page desta organização.',
      );
    }

    return true;
  }
}
