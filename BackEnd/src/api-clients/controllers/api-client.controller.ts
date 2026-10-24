import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiClientService } from '../services/api-client.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { ZodValidationPipe } from '../../shared/pipe/zod-validation.pipe';
import { zodToOpenApi } from '../../shared/swagger/zod-to-openapi';
import {
  createApiClientResponseSchema,
  createApiClientSchema,
  CreateApiClientDto,
  rotateSecretResponseSchema,
  updateApiClientSchema,
  UpdateApiClientDto,
  apiClientResponseSchema,
} from '../dto/api-client.zod';
import { z } from 'zod';

@ApiTags('API Clients (Aplicações Externas)')
@ApiBearerAuth('jwt')
@UseGuards(AuthGuard, SuperAdminGuard)
@Controller('api-clients')
export class ApiClientController {
  constructor(private readonly apiClientService: ApiClientService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar nova aplicação externa (API Client)',
    description:
      'Gera credenciais de servidor (clientId e clientSecret) para uma aplicação externa. O segredo é exibido apenas nesta resposta.',
  })
  @ApiBody({ schema: zodToOpenApi(createApiClientSchema) })
  @ApiResponse({
    status: 201,
    description: 'API Client criado com sucesso.',
    schema: zodToOpenApi(createApiClientResponseSchema),
  })
  @UsePipes(new ZodValidationPipe(createApiClientSchema))
  async create(@Body() dto: CreateApiClientDto) {
    return this.apiClientService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as aplicações externas',
    description: 'Retorna a lista de aplicações cadastradas (sem os segredos).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de aplicações.',
    schema: zodToOpenApi(z.array(apiClientResponseSchema)),
  })
  async findAll() {
    return this.apiClientService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma aplicação externa' })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(apiClientResponseSchema),
  })
  async findById(@Param('id') id: string) {
    return this.apiClientService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar configurações de uma aplicação externa',
  })
  @ApiBody({ schema: zodToOpenApi(updateApiClientSchema) })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(apiClientResponseSchema),
  })
  @UsePipes(new ZodValidationPipe(updateApiClientSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateApiClientDto) {
    return this.apiClientService.update(id, dto);
  }

  @Post(':id/rotate-secret')
  @ApiOperation({
    summary: 'Rotacionar o segredo (clientSecret) de uma aplicação',
    description:
      'Gera um novo clientSecret para a aplicação e invalida imediatamente o anterior.',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(rotateSecretResponseSchema),
  })
  async rotateSecret(@Param('id') id: string) {
    return this.apiClientService.rotateSecret(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desativar aplicação externa (soft delete)',
  })
  @ApiResponse({
    status: 200,
    schema: zodToOpenApi(z.object({ message: z.string() })),
  })
  async deactivate(@Param('id') id: string) {
    return this.apiClientService.deactivate(id);
  }
}
