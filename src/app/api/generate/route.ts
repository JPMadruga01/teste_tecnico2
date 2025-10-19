import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/src/lib/supabase";
import { inputSchema } from "@/src/lib/validate";
import { systemPrompt, outputSchema } from "@/src/lib/prompt";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inputSchema.parse(body);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
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

    const { response } = await model.generateContent([
      { role: "user", parts: [{ text: systemPrompt + "\n\n" + userContext }] }
    ]);

    const text = response.text();
    let generated: any;
    try { generated = JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Falha ao parsear JSON da IA.");
      generated = JSON.parse(match[0]);
    }

    const bnccArray = parsed.bncc_codes
      ? parsed.bncc_codes.split(",").map(s => s.trim()).filter(Boolean)
      : null;

    const { data, error } = await supabase
      .from("lesson_plans")
      .insert([{
        user_id: null,
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
        raw_model_response: response.candidates?.[0] ?? null
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, plan: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message ?? "Erro inesperado" }, { status: 400 });
  }
}
