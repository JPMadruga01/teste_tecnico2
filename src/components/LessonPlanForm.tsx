"use client";
import { useState, useRef, useEffect } from 'react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import type { LessonPlan } from '../App';

interface LessonPlanFormProps {
  onPlanGenerated: (plan: LessonPlan) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  token?: string | null;
  className?: string;
}

export function LessonPlanForm({ onPlanGenerated, loading, setLoading, token, className }: LessonPlanFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    grade: '',
    duration: '',
    classSize: '',
    bnccCodes: '',
    objectives: '',
    resources: '',
    constraints: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Prefer a logged-in user's access token when available; fall back to public anon key
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['Authorization'] = `Bearer ${publicAnonKey}`;
      }

      // Build payload that matches server input schema
      const durationMatch = String(formData.duration).match(/(\d+)/);
      const durationMinutes = durationMatch ? Number(durationMatch[1]) : undefined;

      const payload = {
        subject: formData.subject,
        topic: formData.topic,
        grade: formData.grade,
        school_year: formData.grade || undefined,
        duration: formData.duration,
        duration_minutes: durationMinutes,
        class_size: formData.classSize,
        bncc_codes: formData.bnccCodes,
        teacher_goals: formData.objectives,
        resources: formData.resources,
        constraints: formData.constraints,
        language: 'pt-BR'
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8f84519f/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        // Try to parse JSON error from server
        try {
          const errJson = JSON.parse(text);
          console.error('Error generating lesson plan:', errJson);
          setErrorMessage(errJson.error || errJson.message || JSON.stringify(errJson));
        } catch {
          console.error('Error generating lesson plan:', text);
          setErrorMessage(text || 'Erro ao gerar o plano de aula');
        }
        return;
      }

      let plan: any;
      try {
        plan = JSON.parse(text);
      } catch {
        plan = text;
      }

      // Keep form state but notify parent with the generated plan
      onPlanGenerated(plan);
      setSuccessMessage('Plano de aula gerado com sucesso.');
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrorMessage((error as any)?.message ?? 'Erro ao gerar o plano de aula. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (errorMessage && errorRef.current) {
      errorRef.current.focus();
    }
  }, [errorMessage]);

  return (
    <Card className={cn('p-8 shadow-xl border-0 bg-white/80 backdrop-blur', className)}>
      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
        {/* Inline messages */}
        {errorMessage && (
          <div
            tabIndex={-1}
            ref={errorRef}
            role="alert"
            aria-live="assertive"
            className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div role="status" aria-live="polite" className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Disciplina */}
          <div className="space-y-2">
            <Label htmlFor="subject">Disciplina *</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="Ex: Matemática"
              value={formData.subject}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <Label htmlFor="topic">Tema *</Label>
            <Input
              id="topic"
              name="topic"
              placeholder="Ex: Frações"
              value={formData.topic}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Ano/Série */}
          <div className="space-y-2">
            <Label htmlFor="grade">Ano/Série *</Label>
            <Input
              id="grade"
              name="grade"
              placeholder="Ex: 5º ano"
              value={formData.grade}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duração *</Label>
            <Input
              id="duration"
              name="duration"
              placeholder="Ex: 50 minutos"
              value={formData.duration}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Tamanho da turma */}
          <div className="space-y-2">
            <Label htmlFor="classSize">Tamanho da turma *</Label>
            <Input
              id="classSize"
              name="classSize"
              placeholder="Ex: 30 alunos"
              value={formData.classSize}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {/* Códigos BNCC */}
          <div className="space-y-2">
            <Label htmlFor="bnccCodes">Códigos BNCC (opcional)</Label>
            <Input
              id="bnccCodes"
              name="bnccCodes"
              placeholder="Ex: EF05MA03, EF05MA08"
              value={formData.bnccCodes}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Objetivos do professor */}
        <div className="space-y-2">
          <Label htmlFor="objectives">Objetivos do professor *</Label>
          <Textarea
            id="objectives"
            name="objectives"
            placeholder="Descreva os objetivos de aprendizagem que deseja alcançar com esta aula..."
            value={formData.objectives}
            onChange={handleChange}
            required
            disabled={loading}
            className="min-h-[100px]"
          />
        </div>

        {/* Recursos disponíveis */}
        <div className="space-y-2">
          <Label htmlFor="resources">Recursos disponíveis *</Label>
          <Textarea
            id="resources"
            name="resources"
            placeholder="Ex: Quadro branco, projetor, tablets, material concreto..."
            value={formData.resources}
            onChange={handleChange}
            required
            disabled={loading}
            className="min-h-[80px]"
          />
        </div>

        {/* Restrições / observações */}
        <div className="space-y-2">
          <Label htmlFor="constraints">Restrições / observações</Label>
          <Textarea
            id="constraints"
            name="constraints"
            placeholder="Ex: Alunos com necessidades especiais, tempo limitado, espaço reduzido..."
            value={formData.constraints}
            onChange={handleChange}
            disabled={loading}
            className="min-h-[80px]"
          />
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Gerando plano de aula...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-4" />
              Gerar Plano de Aula
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
