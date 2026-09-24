// src/app/api/users/reset-password/route.ts
import { NextResponse } from 'next/server';
import { getNestApiUrl } from '@/lib/api/serverUtils';

export async function POST(request: Request) {
  const NEST_API_URL = getNestApiUrl();

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/users/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro de comunicação' }, { status: 500 });
  }
}