import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader } from '@/lib/api/serverUtils';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const NEST_API_URL = getNestApiUrl();
  const { id } = await context.params;
  const authorization = await getBffAuthHeader(request);

  if (!authorization) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const nestResponse = await fetch(
      `${NEST_API_URL}/api-clients/${id}/rotate-secret`,
      {
        method: 'POST',
        headers: {
          Authorization: authorization,
        },
      },
    );

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao rotacionar segredo' },
      { status: 500 },
    );
  }
}

