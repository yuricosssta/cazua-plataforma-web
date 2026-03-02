// src/users/repositories/mongoose/user.mongoose.repository.ts

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersRepository } from '../../repositories/user.repository';
import { IUser } from '../../schemas/models/user.interface';
import { User } from '../../schemas/user.schema';
import { CreateUser } from '../../validations/users.zod';

export class UsersMongooseRepository implements UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }
  getAllUsers(): Promise<IUser[]> {
    return this.userModel.find({});
  }

  getUser(userId: string): Promise<IUser> {
    return this.userModel.findById(userId).select('-password').exec(); //adicionado select para não retornar a senha
  }

  searchUser(term: string): Promise<IUser[]> {
    const regex = new RegExp(term, 'i');
    return this.userModel
      .find({
        $or: [{ name: regex }, { isAdmin: regex }, { rule: regex }],
      })
      .exec();
  }

  async createUser(user: CreateUser): Promise<IUser> {
    const createUser = new this.userModel(user);
    return await createUser.save();
  }

  async updateUser(
    userId: string,
    user: Partial<IUser>,
  ): Promise<IUser | null> {
    const updateData = Object.fromEntries(
      Object.entries(user).filter(([, value]) => value !== undefined),
    );

    const result = await this.userModel
      .findOneAndUpdate({ _id: userId }, { $set: updateData }, { new: true })
      .exec();

    return result;
  }

  async findOneByEmail(email: string): Promise<IUser | undefined> {
  return this.userModel.findOne({ email }).exec();
}

  deleteUser(userId: string): Promise<IUser | null> {
    return this.userModel.findByIdAndDelete({ _id: userId }).exec();
  }
}