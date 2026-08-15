//src/components/landing/LeadCaptureForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

const leadFormSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadCaptureFormProps {
  tenantId: string;
  buttonText?: string;
}

export function LeadCaptureForm({ tenantId, buttonText = "Enviar" }: LeadCaptureFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  });

  const onSubmit = async (data: LeadFormData) => {
    setStatus('loading');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenantId }),
      });

      if (!response.ok) throw new Error('Falha ao enviar formulário');
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card text-card-foreground border border-border rounded-md shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-lg font-bold">Contato Enviado!</h3>
        <p className="text-muted-foreground text-center mt-2">
          Sua mensagem foi recebida. Entraremos em contato em breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-card text-card-foreground p-6 border border-border rounded-md shadow-sm w-full max-w-md mx-auto">
      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4" />
          Ocorreu um erro ao enviar. Tente novamente.
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Nome Completo</label>
        <input
          {...register('name')}
          id="name"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">E-mail Profissional</label>
        <input
          {...register('email')}
          id="email"
          type="email"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">Telefone</label>
          <input
            {...register('phone')}
            id="phone"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium">Empresa</label>
          <input
            {...register('company')}
            id="company"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">Mensagem</label>
        <textarea
          {...register('message')}
          id="message"
          rows={3}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground h-9 px-4 py-2 rounded-md font-medium text-sm transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando...' : buttonText}
        <Send className="ml-2 w-4 h-4" />
      </button>
    </form>
  );
}