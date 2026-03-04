// src/users/repositories/mongoose/user.mongoose.repository.ts

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersRepository } from '../../repositories/user.repository';
import { IUser } from '../../schemas/models/user.interface';
import { User } from '../../schemas/user.schema';

export class UsersMongooseRepository implements UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async getUsersByOrganization(orgId: string): Promise<IUser[]> {
    console.log(`Buscando usuários para a organização com ID: ${orgId}`);
    const users = await this.userModel
      .find({ 'memberships.organizationId': orgId })
      .select('-password') // Nunca retorna a senha
      .lean()
      .exec();
    console.log(`Usuários encontrados: ${users.length}`);
    return users as unknown as IUser[];
  }

  async getAllUsers(): Promise<IUser[]> {
    console.log('Buscando todos os usuários do sistema');
    const users = await this.userModel.find({}).select('-password').lean().exec();
    console.log(`Usuários encontrados: ${users.length}`);
    return users as unknown as IUser[];
  }

  async getUser(userId: string): Promise<IUser> {
    console.log(`Buscando usuário com ID: ${userId}`);
    const user = await this.userModel.findById(userId).select('-password').lean().exec();
    if (!user) {
      console.log(`Usuário com ID ${userId} não encontrado.`);
      return null;
    }
    console.log(`Usuário encontrado: ${user.name} (${user.email})`);
    return user as unknown as IUser;
  }

  async searchUser(term: string): Promise<IUser[]> {
    const regex = new RegExp(term, 'i');
    console.log(`Buscando usuários com termo: ${term}`);
    const users = await this.userModel
      .find({
        $or: [{ name: regex }, { email: regex }],
      })
      .select('-password')
      .lean()
      .exec();
    console.log(`Usuários encontrados para termo "${term}": ${users.length}`);
    return users as unknown as IUser[];
  }

  async createUser(user: Partial<IUser>): Promise<IUser> {
    const createUser = new this.userModel(user);
    console.log(`Criando usuário: ${user.name} (${user.email})`);
    const savedUser = await createUser.save();
    console.log(`Usuário criado com ID: ${savedUser._id}`);
    return savedUser.toObject() as unknown as IUser;
  }

  async updateUser(
    userId: string,
    user: Partial<IUser>,
  ): Promise<IUser | null> {
    const updateData = Object.fromEntries(
      Object.entries(user).filter(([, value]) => value !== undefined),
    );
    console.log(`Atualizando usuário com ID: ${userId}`);
    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: userId }, { $set: updateData }, { new: true })
      .select('-password')
      .lean()
      .exec();
    if (!updatedUser) {
      console.log(`Usuário com ID ${userId} não encontrado para atualização.`);
      return null;
    }
    console.log(`Usuário atualizado: ${updatedUser.name} (${updatedUser.email})`);
    return updatedUser as unknown as IUser;
  }

  async findOneByEmail(email: string): Promise<IUser | undefined> {
    const user = await this.userModel.findOne({ email }).lean().exec();
    if (user) {
      console.log(`Usuário encontrado por email: ${email} - ${user.name}`);
      return user as unknown as IUser;
    } else {
      console.log(`Nenhum usuário encontrado com email: ${email}`);
      return undefined;
    }
  }

  async deleteUser(userId: string): Promise<IUser | null> {
    console.log(`Deletando usuário com ID: ${userId}`);
    const deletedUser = await this.userModel.findByIdAndDelete({ _id: userId }).lean().exec();
    return deletedUser as unknown as IUser;
  }
}