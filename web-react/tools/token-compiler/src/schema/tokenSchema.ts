import * as z from "zod"

const validPrefixSchema = z.enum([
  'o',
  's',
  'm',
  'p',
  't',
  'f',
])

export const rawValuesSchema = z.object({
  o: z.string().optional(),
  s: z.string().optional(),
  m: z.string().optional(),
  p: z.string().optional(),
  t: z.string().optional(),
  f: z.string().optional(),
}).strict().refine(
  values => Object.keys(values).length > 0,
)

export const rawVariableSchema = z.object({
  name: z.string().optional(),
  allowed: z.array(validPrefixSchema).min(1).optional(),
  exclude: z.array(validPrefixSchema).min(1).optional(),
  values: rawValuesSchema.optional(),
}).strict()

export const rawVarsSchema = z.record(
  z.string(),
  rawVariableSchema,
).refine(
  vars => Object.keys(vars).length > 0,
)

export const rawTokenSchema = z.object({
  component: z.string().describe('Component name: <component>.module.css'),
  infix: z.string().optional().describe('ClassName and infix.'),
  alwaysAllowed: z.array(validPrefixSchema).min(1).optional(),

  vars: rawVarsSchema
}).strict()