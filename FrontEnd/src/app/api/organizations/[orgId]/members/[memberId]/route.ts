import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function DELETE(request: Request, context: { params: Promise<{ orgId: string; memberId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId, memberId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        ...(authorization && { 'Authorization': authorization }),
        ...(orgIdHeader && { 'x-org-id': orgIdHeader }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
    });

    if (!nestResponse.ok) {
      const data = await nestResponse.json().catch(() => ({}));
      return NextResponse.json({ error: data.message || 'Falha ao remover membro' }, { status: nestResponse.status });
    }

    const data = await nestResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro de comunicação' }, { status: 500 });
  }
}
