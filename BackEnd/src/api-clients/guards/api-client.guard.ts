import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiClientService } from '../services/api-client.service';

@Injectable()
export class ApiClientGuard implements CanActivate {
  constructor(private readonly apiClientService: ApiClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientId = request.headers['x-client-id'] as string;
    const clientSecret = request.headers['x-client-secret'] as string;

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException(
        'Headers x-client-id e x-client-secret são obrigatórios.',
      );
    }

    const client = await this.apiClientService.validateClientCredentials(
      clientId,
      clientSecret,
    );

    if (!client) {
      throw new UnauthorizedException('Credenciais de API Client inválidas ou aplicação desativada.');
    }

    request['apiClient'] = client;
    return true;
  }
}
