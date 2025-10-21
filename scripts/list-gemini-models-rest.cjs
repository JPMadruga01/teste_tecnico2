#!/usr/bin/env node
// Lista os modelos Gemini disponíveis via REST API
// Uso:
//   GOOGLE_API_KEY=... node scripts/list-gemini-models-rest.cjs

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Defina a variável de ambiente GOOGLE_API_KEY.');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log('Modelos disponíveis:');
      data.models.forEach(m => {
        console.log(`- name: ${m.name}`);
        if (m.description) console.log(`  description: ${m.description}`);
        if (m.supportedGenerationMethods) console.log(`  methods: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log('Resposta da API:', data);
    }
  })
  .catch(err => {
    console.error('Erro ao consultar modelos:', err);
    process.exit(2);
  });
