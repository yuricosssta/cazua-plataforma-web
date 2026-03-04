// BackEnd/src/users/controllers/user.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { UsersService } from '../services/user.service';
import {
  CreateUser,
  createUserSchema,
  UpdateUser,
  updateUserSchema,
} from '../validations/users.zod';
import { GetUser } from '../../shared/decorators/get-user-decorator';
import { AuthGuard } from '../../auth/auth.guard';

@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  // 1. ROTAS GERAIS E DE PERFIL (Sem amarras de organização)

  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers() {
    // Retorna todos os usuários (No futuro, restrinja isso apenas para SuperAdmins da sua empresa)
    return this.userService.getAllUsers();
  }

  @UseGuards(AuthGuard)
  @Get('search')
  async searchUser(@Query('term') term: string) {
    return this.userService.searchUser(term);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@GetUser('sub') userId: string) {
    return this.userService.getUser(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    return this.userService.getUser(userId);
  }

  // 2. CRIAÇÃO E ATUALIZAÇÃO DA IDENTIDADE GLOBAL

  @UseGuards(AuthGuard)
  @Post()
  async createUser(
    // Criação simples, sem x-organization-id no cabeçalho
    @Body(new ZodValidationPipe(createUserSchema)) user: CreateUser,
  ) {
    return this.userService.createUser(user);
  }

  @UseGuards(AuthGuard)
  @Put(':userId')
  async updateUser(
    @Param('userId') userId: string,
    // Extraímos apenas o 'name' (memberships não existe mais aqui)
    @Body(new ZodValidationPipe(updateUserSchema)) { name }: UpdateUser,
  ) {
    return this.userService.updateUser(userId, { name });
  }

  @UseGuards(AuthGuard)
  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.userService.deleteUser(userId);
  }
}