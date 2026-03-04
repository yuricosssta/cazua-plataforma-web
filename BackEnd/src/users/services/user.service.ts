// src/users/services/user.service.ts

import {
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
}


// // src/users/services/user.service.ts
// import {
//   ConflictException,
//   Injectable,
//   InternalServerErrorException,
//   NotFoundException,
// } from '@nestjs/common';
// import { UsersRepository } from '../repositories/user.repository';
// import { CreateUser, UpdateUser } from '../validations/users.zod';
// import * as bcrypt from 'bcrypt';
// import { IUser } from '../schemas//models/user.interface';

// @Injectable()
// export class UsersService {
//   constructor(private readonly userRepository: UsersRepository) { }

//   async getUsersByOrganization(orgId: string) {
//     // No Mongoose: Busca usuários cujo array "memberships" contenha o "organizationId"
//     return this.userRepository.find({ 'memberships.organizationId': orgId }).select('-password');
//   }

//   async createUserForOrganization(userDto: CreateUser, orgId: string) {
//     const hashedPassword = await bcrypt.hash(userDto.password, 10);
    
//     try {
//       // Cria o usuário já com o vínculo (Membership) inicial
//       const newUser = {
//         name: userDto.name,
//         email: userDto.email,
//         password: hashedPassword,
//         memberships: [
//           {
//             organizationId: orgId,
//             role: userDto.role || 'MEMBER' // 'MEMBER', 'ADMIN', etc.
//           }
//         ]
//       };

//       return await this.userRepository.createUser(newUser);
      
//     } catch (e: any) {
//       if (e.code === 11000) {
//         // Se o e-mail já existe no banco (o cara já usa o SaaS em outra empresa),
//         // em vez de dar erro, num futuro próximo você faria um "Push" no array memberships dele!
//         throw new ConflictException('Este e-mail já possui conta no sistema.');
//       }
//       throw new InternalServerErrorException('Erro ao criar usuário');
//     }
//   }

//   async getAllUsers() {
//     const users = await this.userRepository.getAllUsers();
//     return users;
//   }

//   async findOne(email: string): Promise<IUser | undefined> {
//     return this.userRepository.findOneByEmail(email);
//   }

//   async searchUser(term: string) {
//     return this.userRepository.searchUser(term);
//   }
//   async getUser(userId: string) {
//     const user = await this.userRepository.getUser(userId);

//     if (!user) throw new NotFoundException('Usuário não encontrado');
//     return user;
//   }

//   async findById(id: string) {
//     // Usamos .select('-password') para que o Mongoose nunca retorne o campo da senha
//     const user = await this.userRepository.getUser(id);
//     return user;
//   }

//   async createUser(user: CreateUser) {
//     const hashedPassword = await bcrypt.hash(user.password, 10);
//     try {
//       return await this.userRepository.createUser({
//         ...user,
//         password: hashedPassword,
//       });
//     } catch (e) {
//       if (e.code === 11000) {
//         throw new ConflictException('Username já está em uso');
//       }
//       throw new InternalServerErrorException('Erro ao criar usuário');
//     }
//   }

//   async updateUser(userId: string, user: UpdateUser) {
//     const updateUser = await this.userRepository.updateUser(userId, user);

//     if (!updateUser) throw new NotFoundException('Usuário não encontrado');
//     return updateUser;
//   }

//   async deleteUser(userId: string) {
//     const deletedUser = await this.userRepository.deleteUser(userId);

//     if (!deletedUser) throw new NotFoundException('Usuário não encontrado');
//     return { message: `Usuário com id ${userId} deletado com sucesso.` };
//   }
// }