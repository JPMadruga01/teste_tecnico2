# Gerador de Plano de Aula (BNCC) — Supabase + Next.js + Gemini

## Stack
- Next.js (App Router)
- Supabase (Postgres + RLS)
- Google AI Studio (Gemini 1.5)
- TypeScript + Zod

## Como rodar
1. **Criar projeto no Supabase** e pegar `URL` e `anon key`.
2. Na aba **SQL**, execute em ordem os scripts da pasta `/sql`:
   - `00_extensions.sql`
   - `01_lesson_plans.sql`
   - `02_rls.sql`
3. Copie `.env.example` para `.env` e preencha as variáveis.
4. Instale e rode:
   ```bash
   npm i
   npm run dev
   ```
5. Acesse `http://localhost:3000`.

## Rotas
- `POST /api/generate` — Gera e salva o plano no Supabase.

## Teste via curl
```bash
curl -X POST http://localhost:3000/api/generate  -H 'Content-Type: application/json'  -d '{
   "subject":"Matemática",
   "topic":"Frações",
   "school_year":"5º ano",
   "duration_minutes":50
 }'
```

## Deploy (Vercel)
- Defina as mesmas variáveis de ambiente no painel.
- Apontar para a mesma base Supabase.
