"use client";
import { useEffect, useState } from "react";
import supabaseClient, { signInWithEmail, signOut, getSession } from "@/src/lib/supabaseClient";
import { LessonPlanForm } from "@/src/components/LessonPlanForm";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // hydrate session on client
    (async () => {
      const s = await getSession();
      setSession(s);
    })();

    const { data: listener } = supabaseClient.auth.onAuthStateChange((event, s) => {
      // `s` is the session object (or null) in the v2 client callback
      setSession((s as any) ?? null);
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  const handleEmailSignIn = async () => {
    if (!email) return alert('Digite seu email para entrar.');
    await signInWithEmail(email);
    alert('Verifique seu email para o link mágico de login.');
  };

  const handleSignOut = async () => {
    await signOut();
    setSession(null);
  };

  return (
  <main className="mx-auto max-w-[1100px]">
      <header className="page-header">
        <div className="brand-badge">📘</div>
        <h1 className="text-xl font-semibold">Gerador de Planos de Aula</h1>
        <p className="page-subtitle">Crie planos de aula personalizados e alinhados com a BNCC usando inteligência artificial</p>
      </header>

      <div className="form-card-container">
        <div className="form-card">
          <div className="flex justify-end mb-4">
            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{session.user?.email}</span>
                <button onClick={handleSignOut} className="bg-gray-200 px-3 py-1 rounded">Sair</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@dominio.com" className="border p-1 rounded text-sm" />
                <button onClick={handleEmailSignIn} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Entrar</button>
              </div>
            )}
          </div>

          <LessonPlanForm onPlanGenerated={setPlan} loading={loading} setLoading={setLoading} token={session?.access_token} />
        </div>
      </div>

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
