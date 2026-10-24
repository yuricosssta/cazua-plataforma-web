import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader } from '@/lib/api/serverUtils';

export async function GET(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const authorization = await getBffAuthHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';

  try {
    const nestResponse = await fetch(
      `${NEST_API_URL}/users/search?term=${encodeURIComponent(term)}`,
      {
        headers: {
          Authorization: authorization,
        },
      },
    );

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro de comunicação com o back-end' },
      { status: 500 },
    );
  }
}

