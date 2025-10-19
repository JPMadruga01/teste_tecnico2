"use client";
import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null); setPlan(null); setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload: any = Object.fromEntries(form.entries());

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setLoading(false);

    if (!json.ok) { setError(json.error); return; }
    setPlan(json.plan);
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Gerador de Plano de Aula (BNCC)</h1>

      <form onSubmit={onSubmit} className="grid gap-3">
        <input name="subject" placeholder="Disciplina (ex: Matemática)" className="border p-2" required />
        <input name="topic" placeholder="Tema (ex: Frações)" className="border p-2" required />
        <input name="school_year" placeholder="Ano/Série (ex: 5º ano)" className="border p-2" required />
        <input name="duration_minutes" type="number" placeholder="Duração em minutos" className="border p-2" required />
        <input name="class_size" type="number" placeholder="Tamanho da turma (opcional)" className="border p-2" />
        <input name="bncc_codes" placeholder="Códigos BNCC (opcional: separados por vírgula)" className="border p-2" />
        <textarea name="teacher_goals" placeholder="Objetivos do professor (opcional)" className="border p-2" />
        <input name="resources" placeholder="Recursos disponíveis (opcional)" className="border p-2" />
        <input name="constraints" placeholder="Restrições/observações (opcional)" className="border p-2" />
        <input name="language" defaultValue="pt-BR" className="border p-2" />

        <button disabled={loading} className="bg-black text-white px-4 py-2 rounded">
          {loading ? "Gerando..." : "Gerar plano"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}

      {plan && (
        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">Plano gerado</h2>
          <div className="p-4 border rounded">
            <p><strong>Disciplina:</strong> {plan.subject}</p>
            <p><strong>Tema:</strong> {plan.topic}</p>
            <p><strong>Ano/Série:</strong> {plan.school_year}</p>
            <p><strong>BNCC:</strong> {(plan.bncc_codes ?? []).join(", ") || "—"}</p>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold">Introdução lúdica</h3>
            <p>{plan.generated?.introducao_ludica}</p>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold">Objetivo (BNCC)</h3>
            <p>{plan.generated?.objetivo_bncc?.descricao}</p>
            <p><strong>Códigos:</strong> {(plan.generated?.objetivo_bncc?.codigos_relacionados ?? []).join(", ")}</p>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold">Passo a passo</h3>
            <ol className="list-decimal pl-6">
              {(plan.generated?.passo_a_passo ?? []).map((p: any) => (
                <li key={p.etapa} className="mb-2">
                  <div><strong>Etapa {p.etapa}:</strong> {p.descricao}</div>
                  {"tempo_min" in p && <div><em>Tempo:</em> {p.tempo_min} min</div>}
                  {p.materiais?.length ? <div><em>Materiais:</em> {p.materiais.join(", ")}</div> : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold">Rubrica de avaliação</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Critério</th>
                  <th className="border p-2">Iniciante</th>
                  <th className="border p-2">Intermediário</th>
                  <th className="border p-2">Avançado</th>
                </tr>
              </thead>
              <tbody>
                {(plan.generated?.rubrica_avaliacao ?? []).map((r: any, i: number) => (
                  <tr key={i}>
                    <td className="border p-2">{r.criterio}</td>
                    <td className="border p-2">{r.iniciante}</td>
                    <td className="border p-2">{r.intermediario}</td>
                    <td className="border p-2">{r.avancado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
