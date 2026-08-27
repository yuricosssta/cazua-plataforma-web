// src/auth/repositories/auth-users.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Injectable()
export class AuthUsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findById(id: Types.ObjectId): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async incrementLoginAttempts(email: string): Promise<User | null> {
    return await this.userModel
      .findOneAndUpdate(
        { email },
        { $inc: { loginAttempts: 1 } },
        { new: true },
      )
      .exec();
  }

  async lockAccount(email: string, lockDurationMs: number): Promise<void> {
    const lockUntil = new Date(Date.now() + lockDurationMs);
    await this.userModel.updateOne({ email }, { $set: { lockUntil } }).exec();
  }

  async resetLoginAttempts(email: string): Promise<void> {
    await this.userModel
      .updateOne(
        { email },
        { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } },
      )
      .exec();
  }
}
