import { IUser } from '../schemas/models/user.interface';
import { CreateUser, UpdateUser } from '../validations/users.zod';
export abstract class UsersRepository {
  abstract getAllUsers(): Promise<IUser[]>;
  abstract searchUser(term: string): Promise<IUser[]>;
  abstract getUser(userId: string): Promise<IUser>;
  abstract createUser(user: CreateUser): Promise<IUser>; 
  abstract deleteUser(userId: string): Promise<IUser | null>;
  abstract findOneByEmail(email: string): Promise<IUser | undefined>;
  abstract updateUser(
    userId: string,
    user: Partial<IUser>,
  ): Promise<IUser | null>;
  abstract getUsersByOrganization(orgId: string): Promise<IUser[]>
  abstract getUserWithPassword(userId: string): Promise<IUser | null>;
}