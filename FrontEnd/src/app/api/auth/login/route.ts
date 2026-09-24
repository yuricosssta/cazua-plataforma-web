import { NextResponse } from 'next/server';
import { getNestApiUrl } from '@/lib/api/serverUtils';

export async function POST(request: Request) {
  const NEST_API_URL = getNestApiUrl();

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json({ error: data.message || 'Falha ao autenticar' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}
