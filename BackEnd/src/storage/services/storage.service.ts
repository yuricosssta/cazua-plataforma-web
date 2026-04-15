//src/storage/storage.service.ts
import { Injectable, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrganizationDocument, Organization } from '../../organization/schemas/organization.schema';
import { FileAsset, FileAssetDocument } from '../schemas/file-asset.schema';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName = process.env.R2_BUCKET_NAME;
  private publicDomain = process.env.R2_PUBLIC_DOMAIN;

  // Limites em Bytes (500MB, 50GB, 500GB)
  private readonly LIMITS = {
    FREE: 500 * 1024 * 1024,
    PRO: 50 * 1024 * 1024 * 1024,
    ENTERPRISE: 500 * 1024 * 1024 * 1024,
  };

  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(FileAsset.name) private fileAssetModel: Model<FileAssetDocument>,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }


  async getPresignedUploadUrl(orgId: string, fileName: string, fileType: string, sizeBytes: number): Promise<{ uploadUrl: string; fileUrl: string }> {
    // 1. Verifica a cota da empresa
    const org = await this.orgModel.findById(orgId).select('plan storageUsed').exec();
    if (!org) throw new ForbiddenException('Organização não encontrada.');

    const limit = this.LIMITS[org.plan as keyof typeof this.LIMITS] || this.LIMITS.FREE;

    if (org.storageUsed + sizeBytes > limit) {
      throw new ForbiddenException(`LIMITE DE ARMAZENAMENTO EXCEDIDO: Seu plano permite até ${limit / (1024 * 1024)}MB. Faça upgrade para liberar mais espaço.`);
    }

    try {
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const fileKey = `${orgId}/${datePrefix}/${uniqueId}-${cleanFileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 60 });
      const fileUrl = `${this.publicDomain}/${fileKey}`;

      return { uploadUrl, fileUrl };
    } catch (error) {
      console.error('Erro ao gerar URL de upload do R2:', error);
      throw new InternalServerErrorException('Falha ao comunicar com o servidor de arquivos.');
    }
  }

  async confirmUploadAndRegister(orgId: string, userId: string, fileUrl: string, fileName: string, mimeType: string, sizeBytes: number) {
    // 1. Salva o registro do arquivo no MongoDB
    const newAsset = new this.fileAssetModel({
      organizationId: new Types.ObjectId(String(orgId)),
      uploadedBy: new Types.ObjectId(String(userId)),
      fileName,
      fileUrl,
      mimeType,
      sizeBytes
    });
    await newAsset.save();

    // 2. Aumenta o "Medidor" da Organização
    await this.orgModel.findByIdAndUpdate(orgId, {
      $inc: { storageUsed: sizeBytes }
    });

    return newAsset;
  }

  // LISTAGEM DE ARQUIVOS 
  async getOrganizationAssets(orgId: string) {
    // Busca o consumo atual
    const org = await this.orgModel.findById(orgId).select('storageUsed').exec();
    if (!org) throw new InternalServerErrorException('Organização não encontrada.');

    // Busca todos os arquivos ordenados do mais recente para o mais antigo
    const assets = await this.fileAssetModel
      .find({ organizationId: new Types.ObjectId(String(orgId)) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return {
      storageUsed: org.storageUsed || 0,
      assets
    };
  }

  // EXCLUSÃO DE ARQUIVOS (Banco + Nuvem)
  async deleteAsset(orgId: string, assetId: string) {
    // Busca o arquivo no banco de dados para descobrir a URL e o Tamanho
    const asset = await this.fileAssetModel.findOne({
      _id: new Types.ObjectId(String(assetId)),
      organizationId: new Types.ObjectId(String(orgId))
    });

    if (!asset) {
      throw new InternalServerErrorException('Arquivo não encontrado no banco de dados.');
    }

    // 2. Extrai a "Key" (O caminho interno) removendo o domínio público da URL
    // Ex: transforma "https://arquivos.site.com/123/foto.jpg" em "123/foto.jpg"
    const fileKey = asset.fileUrl.replace(`${this.publicDomain}/`, '');

    try {
      // Exclui o arquivo fisicamente da Cloudflare R2
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }));
    } catch (error) {
      console.error('Erro ao deletar arquivo no R2:', error);
      throw new InternalServerErrorException('Falha ao excluir o arquivo físico na nuvem.');
    }

    // Exclui o registro do Cartório (MongoDB)
    await this.fileAssetModel.findByIdAndDelete(asset._id);

    // Devolve os Megabytes para a conta da Empresa (Subtrai o tamanho)
    await this.orgModel.findByIdAndUpdate(orgId, {
      $inc: { storageUsed: -Math.abs(asset.sizeBytes) } // Math.abs garante que sempre será uma subtração
    });

    return { message: 'Arquivo excluído e espaço liberado com sucesso.' };
  }

}