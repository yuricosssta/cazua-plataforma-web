// src/app/api/organizations/[orgId]/projects/bulk-import/route.ts
import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function POST(request: Request, context: { params: Promise<{ orgId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { orgId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId: orgIdHeader, orgRole } = getBffOrgHeaders(request);

  try {
    const body = await request.json();

    const nestResponse = await fetch(`${NEST_API_URL}/organizations/${orgId}/projects/bulk-import`, {
      method: 'POST',
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
      return NextResponse.json({ error: data.message || 'Falha ao importar demandas' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}