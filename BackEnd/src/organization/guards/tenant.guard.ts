import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganizationMember, OrganizationMemberDocument } from '../schemas/organization-member.schema';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectModel(OrganizationMember.name) 
    private memberModel: Model<OrganizationMemberDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Validar se o usuário está logado (Defesa em profundidade)
    const user = request.user;
    if (!user || !user.sub) {
      console.error('TenantGuard: Usuário não encontrado no request. Verifique se o AuthGuard foi executado.');
      throw new ForbiddenException('Usuário não autenticado.');
    }

    // 2. Ler o Header
    const orgIdHeader = request.headers['x-org-id'];

    if (!orgIdHeader) {
      throw new BadRequestException('O cabeçalho x-org-id é obrigatório.');
    }

    // Validar se é um ID válido do Mongo (evita crash do banco)
    if (!Types.ObjectId.isValid(orgIdHeader)) {
      throw new BadRequestException('ID da organização inválido.');
    }

    // 3. Verificar no Banco
    // "Existe um registro onde o usuário X está na empresa Y?"
    const membership = await this.memberModel.findOne({
      userId: new Types.ObjectId(user.sub), // Ajuste conforme seu payload do JWT (sub, id, userId)
      organizationId: new Types.ObjectId(orgIdHeader),
    }).exec();

    if (!membership) {
      throw new ForbiddenException('Acesso negado a esta organização.');
    }

    // 4. Injeção de Contexto
    // Anexamos o ID da organização e a ROLE do usuário no request.
    // Assim, os Controllers não precisam buscar no banco de novo.
    request['organizationId'] = membership.organizationId.toString();
    request['userRole'] = membership.role; // Útil para verificar se é ADMIN depois

    return true;
  }
}