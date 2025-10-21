import { generatedSchema } from '../generatedSchema';

describe('generatedSchema', () => {
  test('valid generated plan passes validation', () => {
    const obj = {
      introducao_ludica: 'Uma atividade divertida',
      objetivo_bncc: { descricao: 'Desenvolver...', codigos_relacionados: ['EF05MA01'] },
      passo_a_passo: [ { etapa: 1, descricao: 'Inicie...', tempo_min: 10, materiais: ['papel'] } ],
      rubrica_avaliacao: [ { criterio: 'Participação', iniciante: '...', intermediario: '...', avancado: '...' } ]
    };

    expect(() => generatedSchema.parse(obj)).not.toThrow();
  });

  test('invalid generated plan throws', () => {
    const obj = { introducao_ludica: 'x' };
    expect(() => generatedSchema.parse(obj as any)).toThrow();
  });
});
