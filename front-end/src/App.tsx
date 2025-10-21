import { useState } from 'react';
import { LessonPlanForm } from './components/LessonPlanForm';
import { LessonPlanDisplay } from './components/LessonPlanDisplay';
import { BookOpen } from 'lucide-react';

export interface LessonPlan {
  introduction: string;
  objectives: string[];
  bnccCodes: string[];
  stepByStep: {
    step: string;
    description: string;
    duration: string;
  }[];
  rubric: {
    criteria: string;
    excellent: string;
    good: string;
    needsImprovement: string;
  }[];
}

export default function App() {
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setLessonPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <BookOpen className="size-8 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gerador de Planos de Aula
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Crie planos de aula personalizados e alinhados com a BNCC usando inteligência artificial
          </p>
        </div>

        {/* Main Content */}
        {!lessonPlan ? (
          <LessonPlanForm 
            onPlanGenerated={setLessonPlan} 
            loading={loading}
            setLoading={setLoading}
          />
        ) : (
          <LessonPlanDisplay 
            lessonPlan={lessonPlan} 
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
