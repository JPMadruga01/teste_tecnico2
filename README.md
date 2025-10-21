# Gerador de Plano de Aula (BNCC)

Aplicação Next.js + Supabase que gera planos de aula alinhados à BNCC usando um gerador de texto (Gemini ou mock local).

Stack
- Next.js (App Router)
- Supabase (Postgres + RLS)
- Google Generative AI (Gemini) — opcional (mock disponível para desenvolvimento)
- TypeScript + Zod

Pré-requisitos
- Node 18+ / npm
- Conta no Supabase (se quiser usar DB real)

Setup local
1. Copie `.env.local.example` para `.env.local` e preencha com os valores (não comitar chaves reais).
2. Execute os scripts SQL no Supabase (se for usar DB real):
   - `sql/00_extensions.sql`
   - `sql/01_lesson_plans.sql`
   - `sql/02_rls.sql`
3. Instale dependências e rode em modo dev:

```powershell
npm install
npm run dev
```

Se o seu `3000` já estiver ocupado, o Next escolherá outra porta (3001, 3002...).

Variáveis de ambiente principais
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE (opcional — server-only)
- SUPABASE_JWT_SECRET (opcional)
- GOOGLE_API_KEY (opcional — para usar Gemini)
- GEMINI_MODEL (ex: gemini-1.5-pro)
- USE_MOCK_GENERATOR=true (recomendado para desenvolvimento local sem chave Google)

Testes
- Executar a suíte de testes (Jest):

```powershell
npx jest --color --runInBand
```

Checar endpoints localmente (script automático)
- O repositório inclui `scripts/test-endpoints.cjs` que:
  - inicia o `npm run dev` automaticamente,
  - espera o servidor ficar pronto,
  - faz `GET /` e `POST /api/generate` com um payload de exemplo,
  - imprime respostas e encerra o servidor.

Para rodar com mock (recomendado localmente):

```powershell
$env:USE_MOCK_GENERATOR='true'; node scripts/test-endpoints.cjs
```

Exemplo de chamada direta (curl)

```bash
curl -X POST http://localhost:3000/api/generate \\
  -H 'Content-Type: application/json' \\
  -d '{"subject":"Matemática","topic":"Frações","school_year":"5º ano","duration_minutes":50}'
```

Notas de desenvolvimento
- Por padrão, se `USE_MOCK_GENERATOR=true`, o endpoint `POST /api/generate` retorna um `generated` válido sem chamar a API externa — útil para desenvolvimento e demo.
- Os testes de integração usam mocks para o client generativo e cobrem casos de sucesso e falha.

Próximos passos sugeridos
- Ajustar UX no front-end para exibir mensagens de erro mais claras.
- Documentar e fornecer script de seed para o banco (opcional).

Seeding the database
--------------------

If you want to populate the database with a sample lesson plan for development, use the included seed script. Make sure to set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` (server key) in your environment or `.env.local` before running.

```powershell
SUPABASE_SERVICE_ROLE=your_service_role_key; NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co; node scripts/seed-supabase.cjs
```

This will insert a sample row into the `lesson_plans` table using the admin service role.
