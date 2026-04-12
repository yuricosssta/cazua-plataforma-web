//src/storage/storage.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('storage')
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  async getUploadUrl(@Body() getPresignedUrlDto: GetPresignedUrlDto) {
    return this.storageService.getPresignedUploadUrl(
      getPresignedUrlDto.fileName,
      getPresignedUrlDto.fileType,
    );
  }
}