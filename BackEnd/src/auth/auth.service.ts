//src/auth/auth.service.ts

import * as bcrypt from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) { }

  async signIn(
    email: string,
    pass: string
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(email);

    if (!user) {
      console.log('Usuário não encontrado');
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);

    if (!passwordMatch) {
      console.log('Senha incorreta');
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

    console.log('Payload gerado para o JWT:', payload);

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async refreshToken(userPayload: any): Promise<{ access_token: string }> {
    const payload = {
      sub: userPayload.sub,
      name: userPayload.name,
      email: userPayload.email,
      isSuperAdmin: userPayload.isSuperAdmin,
    };

    console.log('Token renovado para o usuário:', payload.email);

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

}