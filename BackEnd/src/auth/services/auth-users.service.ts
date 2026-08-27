// src/auth/auth-users.service.ts
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { AuthUsersRepository } from '../repositories/auth-users.repository';

@Injectable()
export class AuthUsersService {
  constructor(private readonly authUsersRepository: AuthUsersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.authUsersRepository.findByEmail(email);
  }

  async findById(id: Types.ObjectId): Promise<User | null> {
    return await this.authUsersRepository.findById(id);
  }

  async incrementLoginAttempts(email: string): Promise<User | null> {
    return await this.authUsersRepository.incrementLoginAttempts(email);
  }

  async lockAccount(email: string, lockDurationMs: number): Promise<void> {
    return await this.authUsersRepository.lockAccount(email, lockDurationMs);
  }

  async resetLoginAttempts(email: string): Promise<void> {
    return await this.authUsersRepository.resetLoginAttempts(email);
  }
}
