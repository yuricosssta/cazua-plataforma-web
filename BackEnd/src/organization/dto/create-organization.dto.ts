import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  // O slug é opcional no envio. Se não vier, geramos no backend.
  // Regex: Apenas letras minúsculas, números e hifens.
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hifens' })
  slug?: string;
}