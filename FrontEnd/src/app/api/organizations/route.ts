import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader } from '@/lib/api/serverUtils';

export async function POST(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const authorization = await getBffAuthHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json({ error: data.message || 'Falha ao criar organização' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}
