// BackEnd/src/users/controllers/user.controller.ts

import {
  BadRequestException,
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

  @UseGuards(AuthGuard)
  @Get()
  async getAllUsers() {
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

  @Post()
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema)) user: CreateUser,
  ) {
    return this.userService.createUser(user);
  }

  @UseGuards(AuthGuard)
  @Put(':userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) { name }: UpdateUser,
  ) {
    return this.userService.updateUser(userId, { name });
  }

  @UseGuards(AuthGuard)
  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.userService.deleteUser(userId);
  }

  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(
    @GetUser('sub') userId: string,
    @Body() body: any // Em um cenário ideal, você criaria um Zod schema para isso: changePasswordSchema
  ) {
    return this.userService.changeUserPassword(userId, body.currentPassword, body.newPassword);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    if (!email) throw new BadRequestException('O e-mail é obrigatório.');
    return this.userService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string
  ) {
    if (!token || !newPassword) throw new BadRequestException('Token e nova senha são obrigatórios.');
    return this.userService.resetPassword(token, newPassword);
  }

}