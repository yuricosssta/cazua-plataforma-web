import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function PATCH(request: Request, context: { params: Promise<{ orgId: string; memberId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId, memberId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/members/${memberId}/role`, {
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
      return NextResponse.json({ error: data.message || 'Falha ao atualizar função' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}
