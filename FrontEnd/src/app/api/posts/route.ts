// src/app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createPostSchema } from '@/validations/post.zod';

const NEST_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts?${searchParams.toString()}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) },
    });
    const data = await nestResponse.json();
    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error) {
    return NextResponse.json({ error: 'Erro de comunicação com o micro-serviço (GET Posts)' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  try {
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    const nestResponse = await fetch(`${NEST_API_URL}/posts`, {
      method: 'POST',
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