// src/app/api/storage/assets/[assetId]/route.ts
import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function DELETE(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { assetId } = await context.params;
  const authorization = await getBffAuthHeader(request);
  const { orgId, orgRole } = getBffOrgHeaders(request);

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/storage/assets/${assetId}`, {
      method: 'DELETE',
      headers: {
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
    });

    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro de comunicação com o back-end' }, { status: 500 });
  }
}