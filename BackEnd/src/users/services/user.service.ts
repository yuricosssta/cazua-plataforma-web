// src/users/services/user.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '../repositories/user.repository';
import { CreateUser, UpdateUser } from '../validations/users.zod';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IUser } from '../schemas/models/user.interface';
import { MailService } from '../../shared/services/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly mailService: MailService,
  ) { }

  async findOne(email: string): Promise<IUser | undefined> {
    return this.userRepository.findOneByEmail(email);
  }

  async createUser(user: CreateUser) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    try {
      return await this.userRepository.createUser({
        ...user,
        password: hashedPassword,
      } as Partial<IUser>);
    } catch (e: any) {
      console.error('Erro ao criar usuário:', e);
      if (e.code === 11000) {
        throw new ConflictException('O E-mail já está em uso');
      }
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  async getAllUsers() {
    return this.userRepository.getAllUsers();
  }

  async searchUser(term: string) {
    return this.userRepository.searchUser(term);
  }

  async getUser(userId: string) {
    const user = await this.userRepository.getUser(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async findById(id: string) {
    return this.userRepository.getUser(id);
  }

  async updateUser(userId: string, user: UpdateUser) {
    const updateUser = await this.userRepository.updateUser(userId, user as Partial<IUser>);
    if (!updateUser) throw new NotFoundException('Usuário não encontrado');
    return updateUser;
  }

  async deleteUser(userId: string) {
    const deletedUser = await this.userRepository.deleteUser(userId);
    if (!deletedUser) throw new NotFoundException('Usuário não encontrado');
    return { message: `Usuário com id ${userId} deletado com sucesso.` };
  }

  async changeUserPassword(userId: string, currentPass: string, newPass: string) {
    if (!currentPass || !newPass) {
      throw new BadRequestException('A senha atual e a nova senha são obrigatórias.');
    }

    const user = await this.userRepository.getUserWithPassword(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const passwordMatch = await bcrypt.compare(currentPass, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    await this.userRepository.updateUser(userId, { password: hashedNewPassword } as Partial<IUser>);

    return { message: 'Senha atualizada com sucesso.' };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOneByEmail(email);
    const successMessage = { message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado.' };

    if (!user) {
      return successMessage;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    await this.userRepository.updateUser(String(user._id || user.id), {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: expireDate
    } as Partial<IUser>);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);

    return successMessage;
  }

  async resetPassword(token: string, newPass: string) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userRepository.findOneByResetToken(resetTokenHash);

    // Validação de segurança: verificar existência do usuário e se o token expirou
    if (!user || (user.resetPasswordExpires && new Date(user.resetPasswordExpires).getTime() < Date.now())) {
      throw new BadRequestException('Token de recuperação inválido ou expirado. Solicite um novo link.');
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    await this.userRepository.updateUser(String(user._id || user.id), {
      password: hashedNewPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    } as any);

    return { message: 'Sua senha foi redefinida com sucesso! Você já pode fazer o login.' };
  }
}