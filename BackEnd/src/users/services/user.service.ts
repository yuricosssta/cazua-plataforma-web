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

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) { }

  async findOne(email: string): Promise<IUser | undefined> {
    return this.userRepository.findOneByEmail(email);
  }

  async createUser(user: CreateUser) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    try {
      // Cria a Identidade Global
      return await this.userRepository.createUser({
        ...user,
        password: hashedPassword,
      } as Partial<IUser>);
    } catch (e: any) {
      console.error('Erro ao criar usuário:', e);
      if (e.code === 11000) {
        // Isso retorna o Erro 409 (Conflict). 
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

    // Busca o usuário com o password
    const user = await this.userRepository.getUserWithPassword(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Compara a senha digitada com a senha do banco
    const passwordMatch = await bcrypt.compare(currentPass, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    // Salva usando o repository
    await this.userRepository.updateUser(userId, { password: hashedNewPassword } as Partial<IUser>);

    return { message: 'Senha atualizada com sucesso.' };
  }

  // Esqueci minha senha
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOneByEmail(email);
    if (!user) {
      return { message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado.' };
    }

    // 1. Gera um Token Aleatório Seguro (Hexadecimal)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Define a validade para 1 hora a partir de agora
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    // 3. Salva no banco (Certifique-se que seu updateUser aceita esses campos)
    await this.userRepository.updateUser(String(user._id), {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expireDate
    } as Partial<IUser>);

    // 4. "Envia" o e-mail
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`; // teste
    console.log(`\n\n[SIMULAÇÃO DE E-MAIL]`);
    console.log(`Para: ${user.email}`);
    console.log(`Assunto: Recuperação de Senha - Cazuá`);
    console.log(`Clique no link para redefinir sua senha: ${resetLink}\n\n`);

    return { message: 'Se o e-mail existir em nossa base, um link de recuperação será enviado.' };
  }

  async resetPassword(token: string, newPass: string) {
    // Busca um usuário que tenha ESTE token
    const user = await this.userRepository.findOneByResetToken(token);

    if (!user) {
      throw new BadRequestException('Token de recuperação inválido ou expirado. Solicite um novo link.');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    // Salva a nova senha e DESTROI o token para ele não ser usado de novo
    await this.userRepository.updateUser(String(user._id || user.id), {
      password: hashedNewPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    } as any);

    return { message: 'Sua senha foi redefinida com sucesso! Você já pode fazer o login.' };
  }

}