import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  Target, 
  BookOpen, 
  ListOrdered, 
  ClipboardCheck,
  Download,
  Printer
} from 'lucide-react';
import type { LessonPlan } from '../App';

interface LessonPlanDisplayProps {
  lessonPlan: LessonPlan;
  onReset: () => void;
}

export function LessonPlanDisplay({ lessonPlan, onReset }: LessonPlanDisplayProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plano-de-aula.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateTextContent = () => {
    let content = '=== PLANO DE AULA ===\n\n';
    
    content += '📚 INTRODUÇÃO LÚDICA\n';
    content += lessonPlan.introduction + '\n\n';
    
    content += '🎯 OBJETIVOS DE APRENDIZAGEM\n';
    lessonPlan.objectives.forEach((obj, i) => {
      content += `${i + 1}. ${obj}\n`;
    });
    content += '\n';
    
    if (lessonPlan.bnccCodes.length > 0) {
      content += 'Códigos BNCC: ' + lessonPlan.bnccCodes.join(', ') + '\n\n';
    }
    
    content += '📝 PASSO A PASSO\n';
    lessonPlan.stepByStep.forEach((step, i) => {
      content += `\nPasso ${i + 1}: ${step.step}\n`;
      content += `Duração: ${step.duration}\n`;
      content += `${step.description}\n`;
    });
    content += '\n';
    
    content += '✅ RUBRICA DE AVALIAÇÃO\n';
    lessonPlan.rubric.forEach((item) => {
      content += `\nCritério: ${item.criteria}\n`;
      content += `  Excelente: ${item.excellent}\n`;
      content += `  Bom: ${item.good}\n`;
      content += `  Precisa melhorar: ${item.needsImprovement}\n`;
    });
    
    return content;
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-between items-center print:hidden">
        <Button
          onClick={onReset}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Criar Novo Plano
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2"
          >
            <Printer className="size-4" />
            Imprimir
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            className="gap-2"
          >
            <Download className="size-4" />
            Baixar
          </Button>
        </div>
      </div>

      {/* Lesson Plan Content */}
      <div className="space-y-6">
        {/* Introduction */}
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="size-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-orange-900">Introdução Lúdica</h2>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">{lessonPlan.introduction}</p>
        </Card>

        {/* Objectives */}
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="size-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-blue-900">Objetivos de Aprendizagem</h2>
            </div>
          </div>
          
          <ul className="space-y-3">
            {lessonPlan.objectives.map((objective, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center size-6 rounded-full bg-blue-600 text-white text-sm">
                  {index + 1}
                </span>
                <span className="text-gray-700 pt-0.5">{objective}</span>
              </li>
            ))}
          </ul>

          {lessonPlan.bnccCodes.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Códigos BNCC:</span>
                {lessonPlan.bnccCodes.map((code, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                    {code}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Step by Step */}
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <ListOrdered className="size-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-green-900">Passo a Passo</h2>
            </div>
          </div>

          <div className="space-y-6">
            {lessonPlan.stepByStep.map((step, index) => (
              <div key={index} className="relative pl-8 pb-6 last:pb-0">
                {index < lessonPlan.stepByStep.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-green-200" />
                )}
                <div className="absolute left-0 top-0 flex items-center justify-center size-8 rounded-full bg-green-600 text-white">
                  {index + 1}
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-green-900">{step.step}</h3>
                    <Badge variant="outline" className="flex-shrink-0 border-green-300 text-green-700">
                      {step.duration}
                    </Badge>
                  </div>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rubric */}
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClipboardCheck className="size-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-purple-900">Rubrica de Avaliação</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-200">
                  <th className="text-left p-3 text-purple-900">Critério</th>
                  <th className="text-left p-3 text-purple-900">Excelente</th>
                  <th className="text-left p-3 text-purple-900">Bom</th>
                  <th className="text-left p-3 text-purple-900">Precisa Melhorar</th>
                </tr>
              </thead>
              <tbody>
                {lessonPlan.rubric.map((item, index) => (
                  <tr key={index} className="border-b border-purple-100">
                    <td className="p-3 text-gray-800">{item.criteria}</td>
                    <td className="p-3 text-gray-700">{item.excellent}</td>
                    <td className="p-3 text-gray-700">{item.good}</td>
                    <td className="p-3 text-gray-700">{item.needsImprovement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
