#!/usr/bin/env node
// Lista os modelos Gemini disponíveis para sua chave Google Generative AI
// Uso:
//   GOOGLE_API_KEY=... node scripts/list-gemini-models.cjs

const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Defina a variável de ambiente GOOGLE_API_KEY.');
  process.exit(1);
}

(async () => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = await genAI.listModels();
    console.log('Modelos disponíveis:');
    if (models && models.models) {
      models.models.forEach(m => {
        console.log(`- name: ${m.name}`);
        if (m.description) console.log(`  description: ${m.description}`);
        if (m.supportedGenerationMethods) console.log(`  methods: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
      console.log(models);
    }
  } catch (err) {
    console.error('Erro ao listar modelos:', err);
    process.exit(2);
  }
})();
