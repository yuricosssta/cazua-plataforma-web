//src/storage/dto/get-presigned-url.dto.ts
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do arquivo é obrigatório.' })
  fileName: string;

  @IsString()
  @IsNotEmpty({ message: 'O tipo do arquivo (MIME type) é obrigatório.' })
  @Matches(/image\/(jpeg|png|webp)|application\/pdf/, { 
    message: 'Tipo de arquivo não permitido. Apenas imagens e PDFs são aceitos.' 
  })
  fileType: string;
}