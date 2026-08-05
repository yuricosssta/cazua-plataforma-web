// src/auth/auth.service.ts
import * as bcrypt from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthUsersService } from './auth-users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly authUsersService: AuthUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.authUsersService.findByEmail(email);

    // Validação de segurança e Soft Delete
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const isSuperAdmin = user.email === superAdminEmail;

    const payload = {
      sub: user._id,
      name: user.name,
      email: user.email,
      isSuperAdmin,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async refreshToken(userPayload: any): Promise<{ access_token: string }> {
    // Instanciamento estrito de ObjectId para busca
    const userId = new Types.ObjectId(userPayload.sub);
    const user = await this.authUsersService.findById(userId);

    // Bloqueia emissão caso usuário tenha sido desativado (Soft Delete) após o login original
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Sessão expirada ou usuário inativo.');
    }

    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    
    // Atualiza privilégios baseando-se no banco de dados atual, não no payload antigo
    const payload = {
      sub: user._id,
      name: user.name,
      email: user.email,
      isSuperAdmin: user.email === superAdminEmail,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}