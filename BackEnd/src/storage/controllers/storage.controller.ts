//src/storage/controllers/storage.controller.ts
import { Get, Delete, Param, ForbiddenException, Controller, Post, Body, UseGuards, Headers, Req, BadRequestException } from '@nestjs/common';
import { StorageService } from '../services/storage.service';
import { GetPresignedUrlDto } from '../dto/get-presigned-url.dto';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) { }

  // SOLICITAÇÃO DO LINK DE UPLOAD (Aplica a trava do limite de espaço do plano)
  @Post('presigned-url')
  async getUploadUrl(
    @Headers('x-org-id') orgId: string,
    @Body() dto: GetPresignedUrlDto
  ) {
    if (!orgId) {
      throw new BadRequestException('Contexto da organização (x-org-id) é obrigatório no cabeçalho.');
    }

    return this.storageService.getPresignedUploadUrl(
      orgId,
      dto.fileName,
      dto.fileType,
      dto.sizeBytes
    );
  }

  // CONFIRMAÇÃO DO UPLOAD (Grava o registro no banco e consome a franquia em MB)
  @Post('confirm-upload')
  async confirmUpload(
    @Headers('x-org-id') orgId: string,
    @Req() req: any,
    @Body() body: { fileUrl: string; fileName: string; mimeType: string; sizeBytes: number }
  ) {
    if (!orgId) {
      throw new BadRequestException('Contexto da organização (x-org-id) é obrigatório no cabeçalho.');
    }

    // Extrai o ID do usuário que fez o upload a partir do Token JWT
    const userId = req.user?.sub || req.user?.id;

    return this.storageService.confirmUploadAndRegister(
      orgId,
      userId,
      body.fileUrl,
      body.fileName,
      body.mimeType,
      body.sizeBytes
    );
  }

  // LISTAR ARQUIVOS DA EMPRESA
  @Get('assets')
  async getAssets(@Headers('x-org-id') orgId: string) {
    if (!orgId) throw new BadRequestException('Contexto da organização (x-org-id) é obrigatório.');

    return this.storageService.getOrganizationAssets(orgId);
  }

  // EXCLUIR ARQUIVO
  @Delete('assets/:id')
  async deleteAsset(
    @Param('id') assetId: string,
    @Headers('x-org-id') orgId: string,
    @Headers('x-org-role') role: string // Pega o cargo do cabeçalho
  ) {
    if (!orgId) throw new BadRequestException('Contexto da organização (x-org-id) é obrigatório.');

    // Trava de Segurança Backend: Só dono e admin podem deletar arquivos em nuvem
    if (role !== 'ADMIN' && role !== 'OWNER') {
      throw new ForbiddenException('Apenas administradores podem excluir arquivos do acervo.');
    }

    return this.storageService.deleteAsset(orgId, assetId);
  }

}