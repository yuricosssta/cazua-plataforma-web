import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function DELETE(request: Request, context: { params: Promise<{ orgId: string; projectId: string; memberId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId, projectId, memberId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const body = await request.json().catch(() => ({}));

    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
        ...(orgIdHeader && { 'x-org-id': orgIdHeader }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
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
