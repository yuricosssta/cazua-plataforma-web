import { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const zodToOpenApi = (schema: ZodTypeAny | any): SchemaObject => {
  return zodToJsonSchema(schema as any, {
    target: 'openApi3',
    $refStrategy: 'none',
  }) as unknown as SchemaObject;
};
