import { z } from "zod";

export const inputSchema = z.object({
  subject: z.string().min(2),
  topic: z.string().min(2),
  school_year: z.string().min(1),
  duration_minutes: z.coerce.number().int().positive(),
  class_size: z.coerce.number().int().positive().optional(),
  bncc_codes: z.string().optional(),
  teacher_goals: z.string().optional(),
  resources: z.string().optional(),
  constraints: z.string().optional(),
  language: z.string().default("pt-BR")
});

export type InputData = z.infer<typeof inputSchema>;
