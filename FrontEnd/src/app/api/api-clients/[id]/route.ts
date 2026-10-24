import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader } from '@/lib/api/serverUtils';

export async function GET(
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
    const nestResponse = await fetch(`${NEST_API_URL}/api-clients/${id}`, {
      headers: {
        Authorization: authorization,
      },
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro de comunicação com o back-end' },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/api-clients/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Payload inválido' },
      { status: 400 },
    );
  }
}

export async function DELETE(
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
    const nestResponse = await fetch(`${NEST_API_URL}/api-clients/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authorization,
      },
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Erro ao desativar aplicação' },
      { status: 500 },
    );
  }
}

