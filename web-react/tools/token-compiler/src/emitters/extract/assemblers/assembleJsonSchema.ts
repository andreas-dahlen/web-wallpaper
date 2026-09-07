import path from 'node:path';
import { rawTokenSchema, rawValuesSchema, rawVarsSchema } from '../../../schema/tokenSchema.ts';
import * as z from 'zod';



export type SchemaData = {
  outputFile: string,
  content: string
}


export function assembleJsonSchema(
  outPath: string
): SchemaData {

  return {
    outputFile: path.join(outPath, "metadata/token.schema.json"),
    content: JSON.stringify(z.toJSONSchema(rawTokenSchema, {
      override: ({ zodSchema, jsonSchema }) => {
        if (zodSchema === rawValuesSchema) {
          jsonSchema.minProperties = 1
        }

        if (zodSchema === rawVarsSchema) {
          jsonSchema.minProperties = 1
        }
      },
    }), null, 2) + '\n'
  }
}