import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Get,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { SignInDto, signInSchema } from '../dto/sign-in.dto';
import { RegisterDto, registerSchema } from '../dto/register.dto';
import {
  tokenResponseSchema,
  jwtPayloadSchema,
  registerResponseSchema,
} from '../dto/auth-response.dto';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiClientGuard } from '../../api-clients/guards/api-client.guard';
import { zodToOpenApi } from '../../shared/swagger/zod-to-openapi';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Login com e-mail e senha',
    description:
      'Gera access token JWT. Bloqueia a conta por 60 minutos após 5 tentativas incorretas consecutivas. Rate limit: 5 requisições por 10s.',
  })
  @ApiBody({ schema: zodToOpenApi(signInSchema) })
  @ApiResponse({
    status: 200,
    description: 'Login efetuado com sucesso.',
    schema: zodToOpenApi(tokenResponseSchema),
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou conta bloqueada temporariamente.',
  })
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UsePipes(new ZodValidationPipe(signInSchema))
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @ApiOperation({
    summary: 'Auto-cadastro com organização fixa (via API Client)',
    description:
      'Permite que aplicações externas autorizadas criem usuários e os vinculem diretamente a uma organização permitida. Se o usuário já existir no Cazuá com as mesmas credenciais, apenas adiciona o vínculo.',
  })
  @ApiSecurity('client-id')
  @ApiSecurity('client-secret')
  @ApiBody({ schema: zodToOpenApi(registerSchema) })
  @ApiResponse({
    status: 201,
    description: 'Usuário cadastrado/vinculado e autenticado.',
    schema: zodToOpenApi(registerResponseSchema),
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais do API Client inválidas.',
  })
  @ApiResponse({
    status: 403,
    description: 'Organização não permitida para esta aplicação.',
  })
  @ApiResponse({
    status: 409,
    description:
      'E-mail já existente no Cazuá com senha divergente da enviada.',
  })
  @UseGuards(ApiClientGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(@Body() registerDto: RegisterDto, @Request() req: any) {
    return this.authService.register(registerDto, req.apiClient);
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Obter payload do token JWT do usuário autenticado',
    description:
      'Recomendado para aplicações externas validarem o token do Cazuá via backend-to-backend.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(jwtPayloadSchema),
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Renovar token de acesso JWT',
    description:
      'Gera um novo access_token para o usuário autenticado, desde que a conta continue ativa.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(tokenResponseSchema),
  })
  @UseGuards(AuthGuard)
  @Post('refresh')
  async refresh(@Request() req: any) {
    return this.authService.refreshToken(req.user);
  }
}
