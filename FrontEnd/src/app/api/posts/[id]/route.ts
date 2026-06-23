//src/app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updatePostSchema } from '@/validations/post.zod';

const NEST_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: Request, context: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const { id } = context.params;

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts/${id}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro de comunicação (GET Post)' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const { id } = context.params;

  try {
    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    const nestResponse = await fetch(`${NEST_API_URL}/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(validatedData),
    });
    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const { id } = context.params;

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro de comunicação (DELETE Post)' }, { status: 500 });
  }
}