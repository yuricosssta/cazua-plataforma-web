import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function PATCH(request: Request, context: { params: Promise<{ orgId: string; resourceId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId, resourceId } = await context.params;
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

    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/resources/${resourceId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await nestResponse.json();

    if (!nestResponse.ok) {
      return NextResponse.json({ error: data.message || 'Falha ao atualizar recurso' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}
