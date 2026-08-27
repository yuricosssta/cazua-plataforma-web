import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateTranscriptionDto {
  @IsNotEmpty({ message: 'A URL não pode ser vazia.' })
  @IsUrl({}, { message: 'Por favor, forneça uma URL válida.' })
  url: string;
}
