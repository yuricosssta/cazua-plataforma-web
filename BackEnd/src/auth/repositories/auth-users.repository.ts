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
    const normalized = email ? email.trim().toLowerCase() : '';
    return await this.userModel
      .findOne({ email: normalized })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  async findById(id: Types.ObjectId): Promise<User | null> {
    const validId = new Types.ObjectId(id);
    return await this.userModel.findById(validId).exec();
  }

  async incrementLoginAttempts(email: string): Promise<User | null> {
    const normalized = email ? email.trim().toLowerCase() : '';
    return await this.userModel
      .findOneAndUpdate(
        { email: normalized },
        { $inc: { loginAttempts: 1 } },
        { new: true },
      )
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  async lockAccount(email: string, lockDurationMs: number): Promise<void> {
    const normalized = email ? email.trim().toLowerCase() : '';
    const lockUntil = new Date(Date.now() + lockDurationMs);
    await this.userModel
      .updateOne({ email: normalized }, { $set: { lockUntil } })
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }

  async resetLoginAttempts(email: string): Promise<void> {
    const normalized = email ? email.trim().toLowerCase() : '';
    await this.userModel
      .updateOne(
        { email: normalized },
        { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } },
      )
      .collation({ locale: 'en', strength: 2 })
      .exec();
  }
}
