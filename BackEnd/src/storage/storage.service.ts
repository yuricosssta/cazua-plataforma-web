//src/storage/storage.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName = process.env.R2_BUCKET_NAME;
  private publicDomain = process.env.R2_PUBLIC_DOMAIN;

  constructor() {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  async getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      // Limpa o nome do arquivo para evitar caracteres estranhos na URL
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      // Cria uma pasta virtual com a data para organizar o Bucket (ex: 2026/04/11-131449-logo.png)
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const fileKey = `${datePrefix}/${uniqueId}-${cleanFileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: fileType,
      });

      // A URL de upload expira em 60 segundos por segurança
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 60 });

      // Esta é a URL final (pública) que salvaremos no banco de dados
      const fileUrl = `${this.publicDomain}/${fileKey}`;

      return { uploadUrl, fileUrl };
    } catch (error) {
      console.error('Erro ao gerar URL de upload do R2:', error);
      throw new InternalServerErrorException('Falha ao comunicar com o servidor de arquivos.');
    }
  }
}