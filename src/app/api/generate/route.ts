import { NextRequest, NextResponse } from "next/server";
import { supabase, getAdminClient } from "@/src/lib/supabase";
import { getUserIdFromToken } from "@/src/lib/auth";
import { inputSchema } from "@/src/lib/validate";
import { systemPrompt, outputSchema } from "@/src/lib/prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from 'fs/promises';
import * as path from 'path';
import { validateGenerated } from "@/src/lib/generatedSchema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inputSchema.parse(body);

  // If developer explicitly requests a mock generator, return a deterministic valid payload
  // This is useful for local dev/demo without a Google API key.
  if (process.env.USE_MOCK_GENERATOR === 'true') {
      const mockGenerated = {
        introducao_ludica: `Atividade introdutória breve para envolver os alunos sobre ${parsed.topic}.`,
        objetivo_bncc: {
          descricao: `Relacionar o conteúdo de ${parsed.topic} com objetivos da BNCC.`,
          codigos_relacionados: parsed.bncc_codes ? parsed.bncc_codes.split(',').map((s: string) => s.trim()) : []
        },
        passo_a_passo: [
          { etapa: 1, descricao: 'Apresentação e sondagem inicial', tempo_min: Math.max(5, Math.floor((parsed.duration_minutes || 50) * 0.15)), materiais: ['Quadro', 'Cartolina'] },
          { etapa: 2, descricao: 'Atividade prática em grupos', tempo_min: Math.max(15, Math.floor((parsed.duration_minutes || 50) * 0.5)), materiais: ['Material concreto'] },
          { etapa: 3, descricao: 'Socialização e fechamento', tempo_min: Math.max(10, Math.floor((parsed.duration_minutes || 50) * 0.35)), materiais: [] }
        ],
        rubrica_avaliacao: [
          { criterio: 'Participação', iniciante: 'Raramente participa', intermediario: 'Participa quando solicitado', avancado: 'Participa ativamente e propõe ideias' },
          { criterio: 'Compreensão', iniciante: 'Demonstra compreensão parcial', intermediario: 'Compreende os procedimentos principais', avancado: 'Consegue aplicar e explicar conceitos' }
        ]
      };

      // mimic insertion flow so UI receives same shape as real flow
      const row = {
        user_id: null,
        subject: parsed.subject,
        topic: parsed.topic,
        school_year: parsed.school_year,
        duration_minutes: parsed.duration_minutes,
        class_size: parsed.class_size ?? null,
        bncc_codes: parsed.bncc_codes ? parsed.bncc_codes.split(',').map((s: string) => s.trim()) : null,
        teacher_goals: parsed.teacher_goals ?? null,
        resources: parsed.resources ?? null,
        constraints: parsed.constraints ?? null,
        language: parsed.language,
        generated: mockGenerated,
        model_name: 'mock-generator',
        raw_model_response: JSON.stringify(mockGenerated)
      };

      // attempt insert, but do not fail if DB unavailable in dev
      try {
        const admin = getAdminClient();
        if (admin) await admin.from('lesson_plans').insert([row]);
        else await supabase.from('lesson_plans').insert([row]);
      } catch (e) {
        // ignore DB errors in mock mode
      }

      return NextResponse.json({ ok: true, plan: row });
    }

    

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "models/gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: outputSchema as any
      }
    });

    const userContext = `
Disciplina: ${parsed.subject}
Tema: ${parsed.topic}
Ano/Série: ${parsed.school_year}
Duração (min): ${parsed.duration_minutes}
Tamanho da turma: ${parsed.class_size ?? "não informado"}
Objetivos do professor: ${parsed.teacher_goals ?? "não informado"}
Códigos BNCC: ${parsed.bncc_codes ?? "não informado"}
Recursos disponíveis: ${parsed.resources ?? "não informado"}
Restrições/observações: ${parsed.constraints ?? "nenhuma"}
Idioma: ${parsed.language}
`;

    const prompt = systemPrompt + "\n\n" + userContext;

    // Diagnostic: save the parsed request early so we have a record even if later steps fail
    try {
      const reqDump = path.resolve(process.cwd(), `temp_payload_request.json`);
      const envDump = path.resolve(process.cwd(), `temp_env_debug.json`);
      try {
        await fs.writeFile(envDump, JSON.stringify({
          timestamp: new Date().toISOString(),
          useMock: process.env.USE_MOCK_GENERATOR === 'true',
          fallbackToMock: process.env.FALLBACK_TO_MOCK === 'true',
          hasGoogleKey: !!process.env.GOOGLE_API_KEY,
          geminiModel: process.env.GEMINI_MODEL || null
        }, null, 2), 'utf-8');
      } catch (ee) {
        // ignore
      }
      await fs.writeFile(reqDump, JSON.stringify({ timestamp: new Date().toISOString(), request: parsed }, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write temp_payload_request.json', e);
    }

    // Compatibility wrapper: try multiple possible method shapes that different
    // versions of `@google/generative-ai` might expose. We attempt calls in
    // sequence and normalize the returned text.
    const callModelAny = async (m: any, promptStr: string): Promise<{ text: string; raw: any }> => {
      const errors: any[] = [];

      const tryExtract = (res: any): string | null => {
        try {
          if (!res) return null;
          if (typeof res === 'string') return res;
          if (typeof res.text === 'function') return res.text();
          if (res.response && typeof res.response.text === 'function') return res.response.text();
          // common shapes
          if (Array.isArray(res.output) && res.output[0]) {
            const o0 = res.output[0];
            if (typeof o0 === 'string') return o0;
            if (o0.content) {
              // content may be array of objects with text
              const c = Array.isArray(o0.content) ? o0.content.map((p: any) => p.text || p.safetyText || '').join('') : (o0.content.text || '');
              if (c) return c;
            }
          }
          if (res.candidates && res.candidates[0]) {
            const cand = res.candidates[0];
            if (typeof cand === 'string') return cand;
            if (cand.content) return JSON.stringify(cand.content);
            if (cand.message && cand.message.content) return JSON.stringify(cand.message.content);
          }
          if (res.result && typeof res.result === 'string') return res.result;
        } catch (e) {
          // swallow
        }
        return null;
      };

      // Candidate call shapes in order of likelihood/compatibility
      const calls: Array<() => Promise<any>> = [];

      // 1) generateContent with simple text part
      if (typeof m.generateContent === 'function') {
        calls.push(() => m.generateContent([{ text: promptStr }]));
        calls.push(() => m.generateContent([{ input: promptStr }]));
      }

      // 2) generate (some libs expose generate or generateText)
      if (typeof m.generate === 'function') calls.push(() => m.generate(promptStr));
      if (typeof m.generate === 'function') calls.push(() => m.generate({ input: promptStr }));
      if (typeof m.generateText === 'function') calls.push(() => m.generateText(promptStr));

      // 3) call / invoke style
      if (typeof m.call === 'function') calls.push(() => m.call({ input: promptStr }));

      // 4) direct client helpers (some wrappers expose client.generate)
      if (typeof m.client === 'object' && typeof m.client.generate === 'function') calls.push(() => m.client.generate({ input: promptStr }));

      // 5) last resort: try calling the model object directly with the prompt
      if (typeof m === 'function') calls.push(() => m(promptStr));

      for (const fn of calls) {
        try {
          const res = await fn();
          const extracted = tryExtract(res);
          if (extracted) return { text: extracted, raw: res };
          // sometimes the shape places the useful text deeper; try stringify then parse
          const asStr = typeof res === 'object' ? JSON.stringify(res) : String(res);
          if (asStr && asStr.length > 0) return { text: asStr, raw: res };
        } catch (e: any) {
          errors.push(e?.message ?? String(e));
          // continue trying other shapes
        }
      }

      throw new Error('Nenhuma forma compatível de chamar o cliente generativo funcionou. Erros: ' + errors.join(' | '));
    }

    let text: string | null = null;
    let raw: any = null;
    let generated: any = null;

    try {
      const result = await callModelAny(model as any, prompt);
      text = result.text;
      raw = result.raw;
      try {
        generated = JSON.parse(text);
      } catch (e) {
        const match = text?.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Falha ao parsear JSON da IA.");
        generated = JSON.parse(match[0]);
      }
    } catch (callErr: any) {
      // If the generative client fails, optionally fall back to the deterministic
      // mock generator when running locally or when explicitly allowed by env.
      const allowMock = process.env.USE_MOCK_GENERATOR === 'true' || process.env.FALLBACK_TO_MOCK === 'true';
      if (!allowMock) {
        throw callErr;
      }

      // Build the same mockGenerated used earlier so the UI/DB shape is identical.
      const mockGenerated = {
        introducao_ludica: `Atividade introdutória breve para envolver os alunos sobre ${parsed.topic}.`,
        objetivo_bncc: {
          descricao: `Relacionar o conteúdo de ${parsed.topic} com objetivos da BNCC.`,
          codigos_relacionados: parsed.bncc_codes ? parsed.bncc_codes.split(',').map((s: string) => s.trim()) : []
        },
        passo_a_passo: [
          { etapa: 1, descricao: 'Apresentação e sondagem inicial', tempo_min: Math.max(5, Math.floor((parsed.duration_minutes || 50) * 0.15)), materiais: ['Quadro', 'Cartolina'] },
          { etapa: 2, descricao: 'Atividade prática em grupos', tempo_min: Math.max(15, Math.floor((parsed.duration_minutes || 50) * 0.5)), materiais: ['Material concreto'] },
          { etapa: 3, descricao: 'Socialização e fechamento', tempo_min: Math.max(10, Math.floor((parsed.duration_minutes || 50) * 0.35)), materiais: [] }
        ],
        rubrica_avaliacao: [
          { criterio: 'Participação', iniciante: 'Raramente participa', intermediario: 'Participa quando solicitado', avancado: 'Participa ativamente e propõe ideias' },
          { criterio: 'Compreensão', iniciante: 'Demonstra compreensão parcial', intermediario: 'Compreende os procedimentos principais', avancado: 'Consegue aplicar e explicar conceitos' }
        ]
      };

      generated = mockGenerated;
      raw = mockGenerated;
      text = JSON.stringify(mockGenerated);
    }

    // Diagnostic: write request + raw model response to separate files for clarity
    try {
      const dumpPath = path.resolve(process.cwd(), 'temp_payload_response.json');
      const payload = {
        timestamp: new Date().toISOString(),
        text: text ?? null,
        raw: raw ?? null
      };
      await fs.writeFile(dumpPath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      // non-fatal
      console.warn('Could not write temp_payload_response.json', e);
    }

    // Validar o JSON gerado contra o schema
    try {
      validateGenerated(generated);
    } catch (err: any) {
      throw new Error(`Resposta da IA inválida: ${err?.message ?? String(err)}`);
    }

    const bnccArray = parsed.bncc_codes
      ? parsed.bncc_codes.split(",").map(s => s.trim()).filter(Boolean)
      : null;
    // Try to extract user id from Authorization header (Bearer token)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader && authHeader.toLowerCase().startsWith('bearer ') ? authHeader.split(' ')[1] : null;
    const user_id = await getUserIdFromToken(token);

    // Choose admin client if available to perform insert (bypass RLS safely on server)
    const admin = getAdminClient();
  const rawCandidate = raw?.candidates?.[0] ?? null;
  const rawStr = rawCandidate ? (typeof rawCandidate === 'string' ? rawCandidate : JSON.stringify(rawCandidate)) : (typeof raw === 'string' ? raw : JSON.stringify(raw));

    const row = {
      user_id: user_id,
      subject: parsed.subject,
      topic: parsed.topic,
      school_year: parsed.school_year,
      duration_minutes: parsed.duration_minutes,
      class_size: parsed.class_size ?? null,
      bncc_codes: bnccArray,
      teacher_goals: parsed.teacher_goals ?? null,
      resources: parsed.resources ?? null,
      constraints: parsed.constraints ?? null,
      language: parsed.language,
      generated,
      model_name: process.env.GEMINI_MODEL || "gemini-1.5-pro",
      raw_model_response: rawStr && rawStr.length > 20000 ? rawStr.slice(0, 20000) : rawStr
    };

    let insertResult;
    if (admin) {
      insertResult = await admin.from('lesson_plans').insert([row]).select().single();
    } else {
      insertResult = await supabase.from('lesson_plans').insert([row]).select().single();
    }

    const { data, error } = insertResult;

    if (error) throw error;

    // Optionally include raw model response in debug output if caller requests it
    const responseBody: any = { ok: true, plan: data };
    try {
      const includeRaw = (req.headers.get('x-include-raw') || '').toLowerCase() === 'true';
      if (includeRaw) {
        const debugRaw = rawStr ? (typeof rawStr === 'string' ? rawStr : JSON.stringify(rawStr)) : null;
        responseBody.raw_model_debug = debugRaw ? (debugRaw.length > 20000 ? debugRaw.slice(0, 20000) : debugRaw) : null;
      }
    } catch (e) {
      // non-fatal: don't leak errors from debug logic
    }

    return NextResponse.json(responseBody);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message ?? "Erro inesperado" }, { status: 400 });
  }
}
