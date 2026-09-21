// src/app/api/organizations/[orgId]/settings/route.ts
import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function PATCH(request: Request, context: { params: Promise<{ orgId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
        ...(orgIdHeader && { 'x-org-id': orgIdHeader }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json({ error: data.message || 'Falha ao atualizar configurações' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}