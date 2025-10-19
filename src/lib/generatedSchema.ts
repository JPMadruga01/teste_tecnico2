import { z } from 'zod';

export const passoSchema = z.object({
  etapa: z.number().int().nonnegative(),
  descricao: z.string(),
  tempo_min: z.number().int().nonnegative().optional(),
  materiais: z.array(z.string()).optional()
});

export const objetivoBnccSchema = z.object({
  descricao: z.string(),
  codigos_relacionados: z.array(z.string())
});

export const rubricaItemSchema = z.object({
  criterio: z.string(),
  iniciante: z.string(),
  intermediario: z.string(),
  avancado: z.string()
});

export const generatedSchema = z.object({
  introducao_ludica: z.string(),
  objetivo_bncc: objetivoBnccSchema,
  passo_a_passo: z.array(passoSchema),
  rubrica_avaliacao: z.array(rubricaItemSchema)
});

export type GeneratedPlan = z.infer<typeof generatedSchema>;

export const validateGenerated = (data: unknown) => generatedSchema.parse(data);
