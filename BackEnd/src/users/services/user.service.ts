import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from '../repositories/user.repository';
import { CreateUser, UpdateUser } from '../validations/users.zod';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IUser } from '../schemas/models/user.interface';
import { MailService } from '../../shared/services/mail.service';
import { IApiClient } from '../../api-clients/schemas/models/api-client.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly mailService: MailService,
  ) {}

  async findOne(email: string): Promise<IUser | undefined> {
    const normalized = email ? email.trim().toLowerCase() : '';
    return this.userRepository.findOneByEmail(normalized);
  }

  async createUser(user: CreateUser): Promise<IUser> {
    const normalizedEmail = user.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(user.password, 10);
    try {
      return await this.userRepository.createUser({
        ...user,
        email: normalizedEmail,
        password: hashedPassword,
      } as Partial<IUser>);
    } catch (e: any) {
      if (e.code === 11000) {
        throw new ConflictException('O E-mail já está em uso.');
      }
      throw new InternalServerErrorException('Erro ao criar usuário.');
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    return this.userRepository.getAllUsers();
  }

  async searchUser(term: string): Promise<IUser[]> {
    if (!term || term.trim().length < 2) {
      throw new BadRequestException(
        'O termo de busca deve conter pelo menos 2 caracteres.',
      );
    }
    return this.userRepository.searchUser(term.trim());
  }

  async getUser(userId: string): Promise<IUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuário inválido.');
    }
    const user = await this.userRepository.getUser(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async findById(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return this.userRepository.getUser(id);
  }

  async updateUser(userId: string, user: UpdateUser): Promise<IUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuário inválido.');
    }
    const updatedUser = await this.userRepository.updateUser(
      userId,
      user as Partial<IUser>,
    );
    if (!updatedUser) throw new NotFoundException('Usuário não encontrado.');
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuário inválido.');
    }
    const deletedUser = await this.userRepository.deleteUser(userId);
    if (!deletedUser) throw new NotFoundException('Usuário não encontrado.');
    return { message: 'Usuário desativado com sucesso.' };
  }

  async changeUserPassword(
    userId: string,
    currentPass: string,
    newPass: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID de usuário inválido.');
    }

    if (!currentPass || !newPass) {
      throw new BadRequestException(
        'A senha atual e a nova senha são obrigatórias.',
      );
    }

    const user = await this.userRepository.getUserWithPassword(userId);
    if (!user || user.isActive === false) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const passwordMatch = await bcrypt.compare(currentPass, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    await this.userRepository.updateUser(userId, {
      password: hashedNewPassword,
    } as Partial<IUser>);

    return { message: 'Senha atualizada com sucesso.' };
  }

  async forgotPassword(
    email: string,
    apiClient?: IApiClient,
  ): Promise<{ message: string }> {
    const normalized = email ? email.trim().toLowerCase() : '';
    const user = await this.userRepository.findOneByEmail(normalized);

    const successMessage = {
      message:
        'Se o e-mail existir em nossa base, um link de recuperação será enviado.',
    };

    // Não envia e-mail se o usuário não existe ou está inativo
    if (!user || user.isActive === false) {
      return successMessage;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    await this.userRepository.updateUser(String(user._id || user.id), {
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: expireDate,
    } as Partial<IUser>);

    let resetUrl: string;
    if (apiClient) {
      if (apiClient.resetPasswordUrl) {
        resetUrl = `${apiClient.resetPasswordUrl}?token=${resetToken}`;
      } else {
        resetUrl = `${process.env.FRONTEND_URL}/recover?token=${resetToken}`;
      }
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetUrl,
        apiClient.name,
      );
    } else {
      resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await this.mailService.sendPasswordResetEmail(user.email, resetUrl);
    }

    return successMessage;
  }

  async resetPassword(token: string, newPass: string): Promise<{ message: string }> {
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.userRepository.findOneByResetToken(resetTokenHash);

    if (
      !user ||
      user.isActive === false ||
      (user.resetPasswordExpires &&
        new Date(user.resetPasswordExpires).getTime() < Date.now())
    ) {
      throw new BadRequestException(
        'Token de recuperação inválido ou expirado. Solicite um novo link.',
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPass, 10);

    await this.userRepository.updateUser(String(user._id || user.id), {
      password: hashedNewPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    } as any);

    return {
      message:
        'Sua senha foi redefinida com sucesso! Você já pode fazer o login.',
    };
  }
}
