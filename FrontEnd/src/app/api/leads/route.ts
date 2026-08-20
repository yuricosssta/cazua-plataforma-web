// src/app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { createLeadSchema } from '@/validations/lead.zod';
import { getNestApiUrl } from '@/lib/api/serverUtils';

// Rota pública do BFF: recebe contatos das landing pages e repassa ao NestJS
export async function POST(request: Request) {
  const NEST_API_URL = getNestApiUrl();

  try {
    const body = await request.json();
    const validatedData = createLeadSchema.parse(body);

    const nestResponse = await fetch(`${NEST_API_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validatedData),
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json(data, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Payload inválido' }, { status: 400 });
  }
}