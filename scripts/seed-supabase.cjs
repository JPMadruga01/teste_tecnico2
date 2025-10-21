#!/usr/bin/env node
/* Seed script for Supabase lesson_plans table.
 * Requires SUPABASE_SERVICE_ROLE and NEXT_PUBLIC_SUPABASE_URL environment variables.
 * Usage:
 *   SUPABASE_SERVICE_ROLE=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/seed-supabase.cjs
 */

import('dotenv').then(() => {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE. See .env.local.example');
    process.exit(2);
  }

  const admin = createClient(url, serviceKey);

  const sample = {
    subject: 'Matemática',
    topic: 'Frações',
    school_year: '5º ano',
    duration_minutes: 50,
    class_size: 30,
    bncc_codes: ['EF05MA03'],
    teacher_goals: 'Entender frações como partes de um todo',
    resources: 'Quadro, material concreto',
    constraints: 'Sem acesso à internet',
    language: 'pt-BR',
    generated: {
      introducao_ludica: 'Atividade introdutória',
    },
    model_name: 'seed-script'
  };

  (async () => {
    try {
      const { data, error } = await admin.from('lesson_plans').insert([sample]).select().single();
      if (error) {
        console.error('Insert error:', error);
        process.exit(1);
      }
      console.log('Inserted sample row:', data);
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
});
