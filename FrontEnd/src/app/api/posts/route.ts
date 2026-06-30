// src/app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { createPostSchema } from '@/validations/post.zod';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';

export async function GET(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  const { searchParams } = new URL(request.url);  
  const authorization = await getBffAuthHeader(request);
  const { orgId, orgRole } = getBffOrgHeaders(request);

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts?${searchParams.toString()}`, {
      headers: { 
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
        'Accept': 'application/json'
      },
    });

    const textResponse = await nestResponse.text();
    let data;
    try { data = JSON.parse(textResponse); } catch (e) {
      return NextResponse.json({ error: 'Resposta inválida do micro-serviço' }, { status: nestResponse.status || 500 });
    }

    if (data && Array.isArray(data.data)) {
      data.data = data.data.map((post: any) => ({ ...post, id: post._id || post.id }));
    }

    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro de conexão com o back-end' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const NEST_API_URL = getNestApiUrl();
  // const cleanBaseUrl = NEST_API_URL.endsWith('/') ? NEST_API_URL.slice(0, -1) : NEST_API_URL;
  
  const authorization = await getBffAuthHeader(request);
  const { orgId, orgRole } = getBffOrgHeaders(request);

  try {
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    const nestResponse = await fetch(`${NEST_API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
      body: JSON.stringify(validatedData),
    });
    
    const data = await nestResponse.json();
    if (data && data._id) data.id = data._id;

    if (!nestResponse.ok) {
        return NextResponse.json({ error: data.message || 'Falha ao salvar' }, { status: nestResponse.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}