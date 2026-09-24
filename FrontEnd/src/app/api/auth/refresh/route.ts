import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader } from '@/lib/api/serverUtils';

export async function POST(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const authorization = await getBffAuthHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': authorization, 'Content-Type': 'application/json' },
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json({ error: data.message || 'Falha ao renovar token' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro de comunicação' }, { status: 500 });
  }
}
