// src/common/pipes/zod-validation.pipe.ts
import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors
          .map((err) =>
            err.path.length > 0
              ? `${err.path.join('.')}: ${err.message}`
              : err.message,
          )
          .join(', ');

        throw new BadRequestException(`Falha na validação: ${errorMessage}`);
      }

      throw new BadRequestException('Falha na validação dos dados.');
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
