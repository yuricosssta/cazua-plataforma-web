import { NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function GET(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const { searchParams } = new URL(request.url);
  const authorization = await getBffAuthHeader(request);
  const { orgId, orgRole } = getBffOrgHeaders(request);

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/planning/grouped?${searchParams.toString()}`, {
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
