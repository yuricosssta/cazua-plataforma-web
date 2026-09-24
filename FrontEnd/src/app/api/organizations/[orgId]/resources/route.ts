import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function GET(request: Request, context: { params: Promise<{ orgId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/resources`, {
      headers: {
        ...(authorization && { 'Authorization': authorization }),
        ...(orgIdHeader && { 'x-org-id': orgIdHeader }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro de comunicação com o back-end' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ orgId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authorization && { 'Authorization': authorization }),
      ...(orgIdHeader && { 'x-org-id': orgIdHeader }),
    };

    const roleHeader = body._orgRole || orgRole;
    if (roleHeader) headers['x-org-role'] = roleHeader;
    delete body._orgRole;

    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/resources`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json({ error: data.message || 'Falha ao criar recurso' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}
