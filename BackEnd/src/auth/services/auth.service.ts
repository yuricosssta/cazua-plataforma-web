import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUsersService } from './auth-users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { UsersService } from '../../users/services/user.service';
import { OrganizationService } from '../../organization/services/organization.service';
import { RegisterDto } from '../dto/register.dto';
import { IApiClient } from '../../api-clients/schemas/models/api-client.interface';
import { User } from '../../users/schemas/user.schema';

@Injectable()
export class AuthService {
  // Constantes de configuração de segurança
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME_MS = 60 * 60 * 1000; // 1 hora

  constructor(
    private readonly authUsersService: AuthUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly organizationService: OrganizationService,
  ) {}

  private async generateAccessToken(user: any): Promise<string> {
    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const isSuperAdmin =
      user.isSuperAdmin === true ||
      (superAdminEmail &&
        user.email?.toLowerCase() === superAdminEmail.toLowerCase());

    const payload = {
      sub: String(user._id || user.id),
      name: user.name,
      email: user.email,
      isSuperAdmin: !!isSuperAdmin,
    };

    return this.jwtService.signAsync(payload, {
      issuer: 'cazua',
      audience: 'cazua-api',
    });
  }

  async validateCredentials(email: string, pass: string): Promise<User> {
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const user = await this.authUsersService.findByEmail(normalizedEmail);

    if (!user || user.isActive === false) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Muitas tentativas falhas. Conta bloqueada temporariamente.',
      );
    }

    if (user.lockUntil && user.lockUntil.getTime() <= Date.now()) {
      await this.authUsersService.resetLoginAttempts(normalizedEmail);
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);

    if (!passwordMatch) {
      const updatedUser =
        await this.authUsersService.incrementLoginAttempts(normalizedEmail);

      if (updatedUser && updatedUser.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        await this.authUsersService.lockAccount(
          normalizedEmail,
          this.LOCK_TIME_MS,
        );
        throw new UnauthorizedException(
          `Muitas tentativas falhas. Conta bloqueada por ${this.LOCK_TIME_MS / 60000} minutos.`,
        );
      }

      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.loginAttempts > 0 || user.lockUntil) {
      await this.authUsersService.resetLoginAttempts(normalizedEmail);
    }

    return user;
  }

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.validateCredentials(email, pass);
    const token = await this.generateAccessToken(user);
    return { access_token: token };
  }

  async register(
    dto: RegisterDto,
    apiClient: IApiClient,
  ): Promise<{ user: any; access_token: string; linked: boolean }> {
    const orgIdObj = new Types.ObjectId(dto.orgId);

    const isOrgAllowed = apiClient.allowedOrgIds.some(
      (allowedId) => String(allowedId) === String(orgIdObj),
    );

    if (!isOrgAllowed) {
      throw new ForbiddenException(
        'A organização informada não é permitida para esta aplicação.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const existingUser = await this.authUsersService.findByEmail(normalizedEmail);

    if (existingUser) {
      // Usuário já cadastrado no Cazuá: valida se a senha fornecida bate
      try {
        await this.validateCredentials(normalizedEmail, dto.password);
      } catch {
        throw new ConflictException(
          'O e-mail informado já está cadastrado no Cazuá, e as credenciais fornecidas não conferem.',
        );
      }

      await this.organizationService.linkUserToOrganization(
        dto.orgId,
        existingUser._id,
        apiClient.defaultRole || 'MEMBER',
      );

      const token = await this.generateAccessToken(existingUser);

      return {
        user: {
          _id: String(existingUser._id),
          name: existingUser.name,
          email: existingUser.email,
          isActive: existingUser.isActive,
        },
        access_token: token,
        linked: true,
      };
    }

    // Usuário novo: cria a conta global e vincula à organização
    const newUser = await this.usersService.createUser({
      name: dto.name,
      email: normalizedEmail,
      password: dto.password,
    });

    await this.organizationService.linkUserToOrganization(
      dto.orgId,
      newUser._id,
      apiClient.defaultRole || 'MEMBER',
    );

    const token = await this.generateAccessToken(newUser);

    return {
      user: {
        _id: String(newUser._id || newUser.id),
        name: newUser.name,
        email: newUser.email,
        isActive: newUser.isActive,
      },
      access_token: token,
      linked: false,
    };
  }

  async refreshToken(userPayload: any): Promise<{ access_token: string }> {
    const userId = new Types.ObjectId(userPayload.sub);
    const user = await this.authUsersService.findById(userId);

    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Sessão expirada ou usuário inativo.');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Conta bloqueada temporariamente.');
    }

    const token = await this.generateAccessToken(user);
    return { access_token: token };
  }
}
