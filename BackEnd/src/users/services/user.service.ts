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
import { IUser } from '../schemas/models/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UsersRepository) { }

  // --- IDENTIDADE GLOBAL ---

  async findOne(email: string): Promise<IUser | undefined> {
    return this.userRepository.findOneByEmail(email);
  }

  async createUser(user: CreateUser) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    try {
      // Cria a Identidade Global de forma limpa, sem se preocupar com cargos (roles) ou organizações.
      return await this.userRepository.createUser({
        ...user,
        password: hashedPassword,
      } as Partial<IUser>);
    } catch (e: any) {
      if (e.code === 11000) {
        // Isso retorna o Erro 409 (Conflict). 
        // O seu OrganizationService está escutando exatamente este erro para reaproveitar o usuário!
        throw new ConflictException('O E-mail já está em uso');
      }
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  // --- MÉTODOS GERAIS/ADMINISTRATIVOS ---

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

}