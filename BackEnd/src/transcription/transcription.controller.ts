//src/transcription/transcription.controller.ts
import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptionService } from './transcription.service';
// import type { File as MulterFile } from 'multer';
import type { Express } from 'express';

@Controller('transcription')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) { }

  // Transcrição via URL do YouTube
  @Post()
  async transcribeFromYoutube(@Body('url') url: string) {
    return this.transcriptionService.transcribeFromYoutube(url);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  //Faz upload de um arquivo de áudio para transcrição
  async transcribeFromFile(@UploadedFile() file: Express.Multer.File) {
    return this.transcriptionService.transcribeFromFile(file);
  }
}

