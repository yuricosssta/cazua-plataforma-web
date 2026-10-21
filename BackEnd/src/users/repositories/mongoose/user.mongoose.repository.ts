import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersRepository } from '../../repositories/user.repository';
import { IUser } from '../../schemas/models/user.interface';
import { User } from '../../schemas/user.schema';

export class UsersMongooseRepository implements UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getUsersByOrganization(orgId: string): Promise<IUser[]> {
    const orgObjectId = new Types.ObjectId(orgId);
    const users = await this.userModel
      .find({ 'memberships.organizationId': orgObjectId, isActive: { $ne: false } })
      .select('-password')
      .lean()
      .exec();
    return users as unknown as IUser[];
  }

  async getAllUsers(): Promise<IUser[]> {
    const users = await this.userModel
      .find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return users as unknown as IUser[];
  }

  async getUser(userId: string): Promise<IUser | null> {
    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel
      .findById(userObjectId)
      .select('-password')
      .lean()
      .exec();
    if (!user) {
      return null;
    }
    return user as unknown as IUser;
  }

  async getUserWithPassword(userId: string): Promise<IUser | null> {
    const userObjectId = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userObjectId).lean().exec();

    if (!user) {
      return null;
    }
    return user as unknown as IUser;
  }

  async searchUser(term: string): Promise<IUser[]> {
    const sanitizedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(sanitizedTerm, 'i');
    const users = await this.userModel
      .find({
        $or: [{ name: regex }, { email: regex }],
      })
      .select('-password')
      .lean()
      .exec();
    return users as unknown as IUser[];
  }

  async createUser(user: Partial<IUser>): Promise<IUser> {
    const normalizedEmail = user.email ? user.email.trim().toLowerCase() : undefined;
    const createUser = new this.userModel({
      ...user,
      ...(normalizedEmail && { email: normalizedEmail }),
    });
    const savedUser = await createUser.save();
    return savedUser.toObject() as unknown as IUser;
  }

  async updateUser(
    userId: string,
    user: Partial<IUser>,
  ): Promise<IUser | null> {
    const userObjectId = new Types.ObjectId(userId);
    const updateData = Object.fromEntries(
      Object.entries(user).filter(([, value]) => value !== undefined),
    );
    if (updateData.email && typeof updateData.email === 'string') {
      updateData.email = updateData.email.trim().toLowerCase();
    }
    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: userObjectId }, { $set: updateData }, { new: true })
      .select('-password')
      .lean()
      .exec();
    if (!updatedUser) {
      return null;
    }
    return updatedUser as unknown as IUser;
  }

  async findOneByEmail(email: string): Promise<IUser | undefined> {
    const normalized = email ? email.trim().toLowerCase() : '';
    // Busca case-insensitive com collation para compatibilidade total
    const user = await this.userModel
      .findOne({ email: normalized })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();

    if (user) {
      return user as unknown as IUser;
    }
    return undefined;
  }

  async findOneByResetToken(tokenHash: string): Promise<IUser | undefined> {
    const user = await this.userModel
      .findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
        isActive: { $ne: false },
      })
      .lean()
      .exec();

    if (user) {
      return user as unknown as IUser;
    }
    return undefined;
  }

  async deleteUser(userId: string): Promise<IUser | null> {
    const userObjectId = new Types.ObjectId(userId);
    // Soft delete conforme regras inegociáveis do projeto
    const deactivatedUser = await this.userModel
      .findByIdAndUpdate(
        userObjectId,
        { $set: { isActive: false } },
        { new: true },
      )
      .select('-password')
      .lean()
      .exec();
    return deactivatedUser as unknown as IUser;
  }
}
