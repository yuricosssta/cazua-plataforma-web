// src/auth/auth.service.ts
import * as bcrypt from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthUsersService } from './auth-users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  // Constantes de configuração de segurança
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME_MS = 60 * 60 * 1000; // 1 hora

  constructor(
    private readonly authUsersService: AuthUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(email: string, pass: string): Promise<{ access_token: string }> {
    const user = await this.authUsersService.findByEmail(email);

    if (!user || user.isActive === false) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Muitas tentativas falhas. Conta bloqueada temporariamente.',
      );
    }

    if (user.lockUntil && user.lockUntil.getTime() <= Date.now()) {
      await this.authUsersService.resetLoginAttempts(email);
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);

    if (!passwordMatch) {
      const updatedUser =
        await this.authUsersService.incrementLoginAttempts(email);

      if (updatedUser && updatedUser.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        await this.authUsersService.lockAccount(email, this.LOCK_TIME_MS);
        throw new UnauthorizedException(
          `Muitas tentativas falhas. Conta bloqueada por ${this.LOCK_TIME_MS / 60000} minutos.`,
        );
      }

      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    if (user.loginAttempts > 0 || user.lockUntil) {
      await this.authUsersService.resetLoginAttempts(email);
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
    const userId = new Types.ObjectId(userPayload.sub);
    const user = await this.authUsersService.findById(userId);

    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Sessão expirada ou usuário inativo.');
    }

    // Trava de segurança para impedir renovação se o usuário foi bloqueado posteriormente
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Conta bloqueada temporariamente.');
    }

    const superAdminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');

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
