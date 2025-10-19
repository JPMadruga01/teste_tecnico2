export const outputSchema = {
  type: "object",
  properties: {
    introducao_ludica: { type: "string" },
    objetivo_bncc: {
      type: "object",
      properties: {
        descricao: { type: "string" },
        codigos_relacionados: { type: "array", items: { type: "string" } }
      },
      required: ["descricao", "codigos_relacionados"]
    },
    passo_a_passo: {
      type: "array",
      items: {
        type: "object",
        properties: {
          etapa: { type: "integer" },
          descricao: { type: "string" },
          tempo_min: { type: "integer" },
          materiais: { type: "array", items: { type: "string" } }
        },
        required: ["etapa", "descricao"]
      }
    },
    rubrica_avaliacao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          criterio: { type: "string" },
          iniciante: { type: "string" },
          intermediario: { type: "string" },
          avancado: { type: "string" }
        },
        required: ["criterio", "iniciante", "intermediario", "avancado"]
      }
    }
  },
  required: ["introducao_ludica","objetivo_bncc","passo_a_passo","rubrica_avaliacao"]
} as const;

export const systemPrompt = `
Você é um especialista pedagógico em BNCC. Gere um plano de aula **em pt-BR**.
Responda **exatamente** no formato JSON fornecido (sem texto extra).
Inclua uma introdução lúdica, objetivos alinhados à BNCC, um passo-a-passo detalhado e uma rubrica de avaliação.
Se o usuário informar códigos BNCC, use-os; caso contrário, selecione códigos apropriados e explique a aderência na "descricao".
Adapte linguagem e exemplos ao ano/série e à disciplina/tema.
`;
