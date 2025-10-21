import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import * as kv from "./kv_store";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-8f84519f/health", (c) => {
  return c.json({ status: "ok" });
});

// Generate lesson plan endpoint
app.post("/make-server-8f84519f/generate", async (c) => {
  try {
    const body = await c.req.json();
    const {
      subject,
      topic,
      grade,
      duration,
      classSize,
      bnccCodes,
      objectives,
      resources,
      constraints,
    } = body;

    // Validate required fields
    if (!subject || !topic || !grade || !duration || !classSize || !objectives || !resources) {
      return c.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate lesson plan
    const lessonPlan = generateLessonPlan({
      subject,
      topic,
      grade,
      duration,
      classSize,
      bnccCodes,
      objectives,
      resources,
      constraints,
    });

    return c.json(lessonPlan);
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return c.json(
      { error: "Failed to generate lesson plan", details: String(error) },
      { status: 500 }
    );
  }
});

// Helper function to generate lesson plan
function generateLessonPlan(data: any) {
  const { subject, topic, grade, duration, classSize, bnccCodes, objectives, resources, constraints } = data;

  // Parse BNCC codes if provided
  const bnccCodeArray = bnccCodes
    ? bnccCodes.split(',').map((code: string) => code.trim()).filter(Boolean)
    : [];

  // Generate introduction
  const introduction = `Para iniciar esta aula sobre ${topic}, vamos criar um momento envolvente que desperte a curiosidade dos alunos. Comece com uma pergunta provocativa ou uma situação-problema relacionada ao tema, permitindo que os ${classSize} alunos compartilhem seus conhecimentos prévios. Utilize ${resources.toLowerCase().split(',')[0] || 'recursos visuais'} para tornar a introdução mais dinâmica e interativa, estabelecendo conexões com o cotidiano dos estudantes do ${grade}.`;

  // Generate objectives
  const objectivesList = objectives.split('\n').filter(Boolean).map((obj: string) => obj.trim());
  const generatedObjectives = objectivesList.length > 0
    ? objectivesList
    : [
        `Compreender os conceitos fundamentais de ${topic}`,
        `Aplicar o conhecimento de ${topic} em situações práticas`,
        `Desenvolver habilidades de análise e reflexão sobre ${topic}`,
        `Colaborar com colegas na resolução de atividades relacionadas a ${topic}`,
      ];

  // Generate step by step
  const totalMinutes = parseInt(duration) || 50;
  const stepByStep = [
    {
      step: "Abertura e Contextualização",
      duration: `${Math.round(totalMinutes * 0.15)} min`,
      description: `Realize a introdução lúdica conforme planejado, explorando os conhecimentos prévios dos alunos sobre ${topic}. Apresente os objetivos da aula de forma clara e conecte o tema com situações do dia a dia.`,
    },
    {
      step: "Apresentação do Conteúdo",
      duration: `${Math.round(totalMinutes * 0.25)} min`,
      description: `Apresente os conceitos principais de ${topic} utilizando ${resources.toLowerCase()}. Explique de forma clara e objetiva, usando exemplos práticos e adequados ao nível de compreensão do ${grade}. Incentive perguntas e participação ativa.`,
    },
    {
      step: "Atividade Prática Guiada",
      duration: `${Math.round(totalMinutes * 0.3)} min`,
      description: `Conduza uma atividade prática onde os alunos possam aplicar os conceitos aprendidos. Organize a turma em grupos ou duplas, considerando o tamanho da sala (${classSize}). Circule pela sala oferecendo suporte e orientações.`,
    },
    {
      step: "Atividade Independente",
      duration: `${Math.round(totalMinutes * 0.2)} min`,
      description: `Proponha uma atividade individual para que cada aluno demonstre sua compreensão do tema. Esta atividade servirá como avaliação formativa e ajudará a identificar dificuldades específicas.`,
    },
    {
      step: "Fechamento e Avaliação",
      duration: `${Math.round(totalMinutes * 0.1)} min`,
      description: `Realize uma síntese coletiva dos principais pontos abordados. Permita que os alunos compartilhem suas descobertas e reflexões. Faça uma breve avaliação oral para verificar a compreensão e planeje as próximas etapas.`,
    },
  ];

  // Add constraints consideration if provided
  if (constraints) {
    stepByStep.push({
      step: "Observações Especiais",
      duration: "Durante toda a aula",
      description: `Atenção às seguintes considerações: ${constraints}. Adapte as atividades conforme necessário para garantir a participação e aprendizagem de todos os alunos.`,
    });
  }

  // Generate rubric
  const rubric = [
    {
      criteria: "Compreensão do Conteúdo",
      excellent: `Demonstra compreensão completa de ${topic}, aplicando conceitos com autonomia e precisão`,
      good: `Compreende os conceitos principais de ${topic} e consegue aplicá-los com algum suporte`,
      needsImprovement: `Apresenta dificuldade em compreender os conceitos básicos de ${topic}`,
    },
    {
      criteria: "Participação e Engajamento",
      excellent: "Participa ativamente, faz perguntas relevantes e contribui para discussões em grupo",
      good: "Participa das atividades quando solicitado e interage com colegas",
      needsImprovement: "Demonstra pouco interesse ou engajamento nas atividades propostas",
    },
    {
      criteria: "Aplicação Prática",
      excellent: "Aplica os conhecimentos em diferentes contextos, fazendo conexões criativas",
      good: "Consegue aplicar os conhecimentos em situações similares às apresentadas",
      needsImprovement: "Tem dificuldade em aplicar os conceitos aprendidos na prática",
    },
    {
      criteria: "Colaboração",
      excellent: "Trabalha colaborativamente, respeitando opiniões e contribuindo para o grupo",
      good: "Participa de atividades em grupo, mas com participação limitada",
      needsImprovement: "Apresenta dificuldade em trabalhar colaborativamente com colegas",
    },
  ];

  return {
    introduction,
    objectives: generatedObjectives,
    bnccCodes: bnccCodeArray,
    stepByStep,
    rubric,
  };
}

// Deno.serve(app.fetch); // Disabled for Node.js/Next.js build compatibility