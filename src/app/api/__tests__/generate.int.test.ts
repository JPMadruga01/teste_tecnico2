/**
 * Integration tests for /api/generate route (with mocks)
 */

jest.mock('../../../lib/supabase', () => {
  const single = jest.fn();
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  const from = jest.fn().mockReturnValue({ insert });
  return {
    supabase: { from },
    getAdminClient: jest.fn(() => null),
  };
});

jest.mock('../../../lib/auth', () => ({
  getUserIdFromToken: jest.fn(async (t: string | null) => (t ? 'user-123' : null)),
}));

const mockGenerate = jest.fn();
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({
      generateContent: mockGenerate,
    }),
  })),
}));

// Mock NextResponse.json used by the route so we can inspect returned body/status
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({ body, status: init?.status ?? 200 }),
  },
}));

import { POST } from '../generate/route';
import { supabase } from '../../../lib/supabase';

function makeReq(payload: any, headers: Record<string,string> = {}) {
  return {
    json: async () => payload,
    headers: {
      get: (k: string) => headers[k.toLowerCase()] ?? null,
    },
  } as any;
}

describe('/api/generate integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('happy path: generates and stores plan', async () => {
    const generated = {
      introducao_ludica: 'Intro',
      objetivo_bncc: { descricao: 'desc', codigos_relacionados: ['EF01'] },
      passo_a_passo: [{ etapa: 1, descricao: 'do' }],
      rubrica_avaliacao: [{ criterio: 'c', iniciante: 'a', intermediario: 'b', avancado: 'c' }]
    };

    mockGenerate.mockResolvedValueOnce({ response: { text: () => JSON.stringify(generated), candidates: [generated] } });

    // prepare supabase insert chain to resolve with data
    const single = jest.fn().mockResolvedValue({ data: { id: 'plan1', subject: 'Mat' }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    (supabase as any).from.mockReturnValue({ insert });

    const payload = {
      subject: 'Mat', topic: 'Frações', school_year: '5º ano', duration_minutes: 45
    };

    const res = await POST(makeReq(payload, { authorization: 'Bearer token-abc' }));

  expect(res.status).toBe(200);
  expect((res as any).body.ok).toBe(true);
    expect((supabase as any).from).toHaveBeenCalledWith('lesson_plans');
    expect(insert).toHaveBeenCalled();
  });

  test('error: model returns invalid json -> 400', async () => {
    mockGenerate.mockResolvedValueOnce({ response: { text: () => 'not json' } });

  const payload = { subject: 'Mat', topic: 'Frações', school_year: '5º ano', duration_minutes: 10 };
    const res = await POST(makeReq(payload));

  expect(res.status).toBe(400);
  expect((res as any).body.ok).toBe(false);
  expect((res as any).body.error).toMatch(/Falha ao parsear JSON/);
  });

  test('admin client used when available and token invalid', async () => {
    const generated = {
      introducao_ludica: 'Intro',
      objetivo_bncc: { descricao: 'desc', codigos_relacionados: ['EF01'] },
      passo_a_passo: [{ etapa: 1, descricao: 'do' }],
      rubrica_avaliacao: [{ criterio: 'c', iniciante: 'a', intermediario: 'b', avancado: 'c' }]
    };

    mockGenerate.mockResolvedValueOnce({ response: { text: () => JSON.stringify(generated), candidates: [generated] } });

  // prepare admin client scenario
    const sup = require('../../../lib/supabase');
    (sup.getAdminClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'plan-admin' }, error: null })
          })
        })
      })
    });

  // ensure auth returns null for this call (invalid token)
  const auth = require('../../../lib/auth');
  (auth.getUserIdFromToken as jest.Mock).mockResolvedValueOnce(null);

    const payload = { subject: 'Mat', topic: 'Frações', school_year: '5º ano', duration_minutes: 45 };

    // simulate invalid token -> getUserIdFromToken returns null in mock
    const res = await POST(makeReq(payload, { authorization: 'Bearer invalid' }));

    expect(res.status).toBe(200);
    expect((res as any).body.ok).toBe(true);
  });
});
