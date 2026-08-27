// src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      const errorMessage = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      throw new BadRequestException(`Falha na validação: ${errorMessage}`);
    }
  }
}

// export class ZodValidationPipe implements PipeTransform {
//   constructor(private schema: ZodSchema) {}

//   transform(value: unknown) {
//     try {
//       return this.schema.parse(value);
//     } catch (error) {
//       throw new BadRequestException('Falha na validação de dados da requisição');
//     }
//   }
// }
