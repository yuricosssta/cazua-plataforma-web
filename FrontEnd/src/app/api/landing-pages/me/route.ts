// src/app/api/landing-pages/me/route.ts
import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

// Prioriza a comunicação interna na rede Docker (Server-side)
export async function GET(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const authorization = await getBffAuthHeader(request);
  const { orgId, orgRole } = getBffOrgHeaders(request);

  if (!authorization || !orgId) {
    return NextResponse.json(
      { message: 'Não autorizado ou identificador de organização ausente.' },
      { status: 401 }
    );
  }

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/landing-pages/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    console.error('[BFF GET /landing-pages/me] Upstream Error:', error);
    return NextResponse.json(
      { message: 'Erro interno de comunicação com o servidor upstream.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const authorization = await getBffAuthHeader(request);
  const { orgId, orgRole } = getBffOrgHeaders(request);

  if (!authorization || !orgId) {
    return NextResponse.json(
      { message: 'Não autorizado ou identificador de organização ausente.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const nestResponse = await fetch(`${NEST_API_URL}/landing-pages/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    console.error('[BFF PATCH /landing-pages/me] Upstream Error:', error);
    return NextResponse.json(
      { message: 'Erro interno de comunicação com o servidor upstream.' },
      { status: 500 }
    );
  }
}