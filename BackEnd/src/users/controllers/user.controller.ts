import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import { LoggingInterceptor } from '../../shared/interceptors/logging.interceptor';
import { UsersService } from '../services/user.service';
import {
  CreateUser,
  createUserSchema,
  UpdateUser,
  updateUserSchema,
  changePasswordSchema,
  ChangePasswordDto,
  forgotPasswordSchema,
  ForgotPasswordDto,
  resetPasswordSchema,
  ResetPasswordDto,
  userResponseSchema,
} from '../validations/users.zod';
import { GetUser } from '../../shared/decorators/get-user-decorator';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { SelfOrSuperAdminGuard } from '../guards/self-or-super-admin.guard';
import { OptionalApiClientGuard } from '../../api-clients/guards/optional-api-client.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { zodToOpenApi } from '../../shared/swagger/zod-to-openapi';
import { z } from 'zod';

@ApiTags('Users')
@UseInterceptors(LoggingInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Listar todos os usuários do sistema',
    description: 'Área restrita ao Super Administrador.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.array(userResponseSchema)),
  })
  @UseGuards(AuthGuard, SuperAdminGuard)
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Buscar usuários por nome ou e-mail',
    description: 'Área restrita ao Super Administrador.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.array(userResponseSchema)),
  })
  @UseGuards(AuthGuard, SuperAdminGuard)
  @Get('search')
  async searchUser(@Query('term') term: string) {
    return this.userService.searchUser(term);
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(userResponseSchema),
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@GetUser('sub') userId: string) {
    return this.userService.getUser(userId);
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Obter dados de um usuário por ID',
    description:
      'Acessível apenas pelo próprio usuário ou pelo Super Administrador.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(userResponseSchema),
  })
  @UseGuards(AuthGuard, SelfOrSuperAdminGuard)
  @Get(':userId')
  async getUser(@Param('userId') userId: string) {
    return this.userService.getUser(userId);
  }

  @ApiOperation({
    summary: 'Criar usuário no Cazuá (cadastro base público)',
    description:
      'Cadastro global de usuário sem vínculo automático com organizações.',
  })
  @ApiBody({ schema: zodToOpenApi(createUserSchema) })
  @ApiResponse({
    status: 201,
    schema: zodToOpenApi(userResponseSchema),
  })
  @UseGuards(ThrottlerGuard)
  @Post()
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema)) user: CreateUser,
  ) {
    return this.userService.createUser(user);
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Atualizar dados de um usuário',
    description:
      'Acessível apenas pelo próprio usuário ou pelo Super Administrador.',
  })
  @ApiBody({ schema: zodToOpenApi(updateUserSchema) })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(userResponseSchema),
  })
  @UseGuards(AuthGuard, SelfOrSuperAdminGuard)
  @Put(':userId')
  async updateUser(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) { name }: UpdateUser,
  ) {
    return this.userService.updateUser(userId, { name });
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Desativar usuário (soft delete)',
    description:
      'Acessível apenas pelo próprio usuário ou pelo Super Administrador.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.object({ message: z.string() })),
  })
  @UseGuards(AuthGuard, SelfOrSuperAdminGuard)
  @Delete(':userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.userService.deleteUser(userId);
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  @ApiBody({ schema: zodToOpenApi(changePasswordSchema) })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.object({ message: z.string() })),
  })
  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(
    @GetUser('sub') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDto,
  ) {
    return this.userService.changeUserPassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Envia link de recuperação para o e-mail informado. Suporta headers opcionais x-client-id e x-client-secret para customizar o remetente e a URL de retorno para aplicações externas.',
  })
  @ApiBody({ schema: zodToOpenApi(forgotPasswordSchema) })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.object({ message: z.string() })),
  })
  @UseGuards(ThrottlerGuard, OptionalApiClientGuard)
  @Post('forgot-password')
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordDto,
    @Req() req: any,
  ) {
    const apiClient = req.apiClient;
    return this.userService.forgotPassword(body.email, apiClient);
  }

  @ApiOperation({ summary: 'Redefinir senha com token de recuperação' })
  @ApiBody({ schema: zodToOpenApi(resetPasswordSchema) })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.object({ message: z.string() })),
  })
  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(body.token, body.newPassword);
  }
}
