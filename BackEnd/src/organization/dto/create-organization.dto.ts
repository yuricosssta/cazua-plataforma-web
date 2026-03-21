//src/organization/dto/create-organization.dto.ts
import { IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'A sigla deve conter no mínimo 2 letras'} )
  @Matches(/^[A-Z]+$/, { message: 'A sigla deve conter apenas letras' })
  @MaxLength(4, { message: 'A sigla deve ter no máximo 4 letras' })
  acronym: string;
 
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hifens' })
  slug?: string;
}