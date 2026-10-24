import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiClientService } from '../services/api-client.service';

@Injectable()
export class OptionalApiClientGuard implements CanActivate {
  constructor(private readonly apiClientService: ApiClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['x-client-id'] as string;
    const clientSecret = request.headers['x-client-secret'] as string;

    // Se nenhum header de client foi enviado, segue normalmente
    if (!clientId && !clientSecret) {
      return true;
    }

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException(
        'Para identificar a aplicação chamadora, forneça ambos os headers x-client-id e x-client-secret.',
      );
    }

    const client = await this.apiClientService.validateClientCredentials(
      clientId,
      clientSecret,
    );

    if (!client) {
      throw new UnauthorizedException(
        'Credenciais de API Client inválidas ou aplicação desativada.',
      );
    }

    request['apiClient'] = client;
    return true;
  }
}
