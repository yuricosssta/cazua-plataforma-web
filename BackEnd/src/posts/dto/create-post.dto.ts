// src/posts/dto/create-post.dto.ts
import { 
  IsBoolean, 
  IsMongoId, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsUrl 
} from 'class-validator';

export class CreatePostDto {
  
  @IsString({ message: 'O título deve ser uma string.' })
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'O conteúdo é obrigatório.' })
  content: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  author?: string; // Implementar para o ID do usuário
  
  @IsOptional()
  @IsMongoId({ message: 'O ID da organização fornecido é inválido.' })
  organizationId?: string;
}