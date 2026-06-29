// src/app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updatePostSchema } from '@/validations/post.zod';

// const NEST_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
function getNestApiUrl() {
  if (process.env.INTERNAL_API_URL) {
    return process.env.INTERNAL_API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return 'http://localhost:3001';
}

async function getAuthHeader(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('access_token')?.value;
  const headerToken = request.headers.get('authorization');
  return headerToken || (cookieToken ? `Bearer ${cookieToken}` : undefined);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { id } = await context.params;
  const authorization = await getAuthHeader(request);
  const orgId = request.headers.get('x-org-id');
  const orgRole = request.headers.get('x-org-role');

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts/${id}`, {
      headers: {
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
    });
    let data = await nestResponse.json();
    if (data && data._id) data.id = data._id;
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro de comunicação (GET Post)' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { id } = await context.params;
  const authorization = await getAuthHeader(request);
  const orgId = request.headers.get('x-org-id');
  const orgRole = request.headers.get('x-org-role');

  try {
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    const nestResponse = await fetch(`${NEST_API_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
      body: JSON.stringify(validatedData),
    });
    let data = await nestResponse.json();
    if (data && data._id) data.id = data._id;

    if (!nestResponse.ok) return NextResponse.json({ error: data.message || 'Falha ao atualizar' }, { status: nestResponse.status });
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const NEST_API_URL = getNestApiUrl();
  const { id } = await context.params;
  const authorization = await getAuthHeader(request);
  const orgId = request.headers.get('x-org-id');
  const orgRole = request.headers.get('x-org-role');

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: {
        ...(authorization && { 'Authorization': authorization }),
        ...(orgId && { 'x-org-id': orgId }),
        ...(orgRole && { 'x-org-role': orgRole }),
      },
    });
    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro de comunicação (DELETE Post)' }, { status: 500 });
  }
}