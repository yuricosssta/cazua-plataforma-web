// src/app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createPostSchema } from '@/validations/post.zod';

// Resolve se está no Docker (INTERNAL) ou no Navegador (NEXT_PUBLIC)
const NEST_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ==========================================
// 1. LISTAGEM DE POSTS (GET)
// ==========================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  try {
    const nestResponse = await fetch(`${NEST_API_URL}/posts?${searchParams.toString()}`, {
      headers: { 
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'Accept': 'application/json'
      },
    });

    const textResponse = await nestResponse.text();
    let data;
    
    try {
      data = JSON.parse(textResponse);
    } catch (parseError) {
      return NextResponse.json({ error: 'Resposta inválida do micro-serviço' }, { status: nestResponse.status || 500 });
    }

    // --- ADAPTAÇÃO DE CONTRATO (BFF): Mapeia _id para id ---
    if (data && Array.isArray(data.data)) {
      data.data = data.data.map((post: any) => ({
        ...post,
        id: post._id || post.id,
      }));
    }

    return NextResponse.json(data, { status: nestResponse.status });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro de conexão com o back-end' }, { status: 500 });
  }
}

// ==========================================
// 2. CRIAÇÃO DE POST (POST)
// ==========================================
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  try {
    const body = await request.json();
    
    // Zod atuando no servidor de borda (BFF)
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

    // --- ADAPTAÇÃO DE CONTRATO (BFF) ---
    if (data && data._id) {
      data.id = data._id;
    }

    // Se o NestJS rejeitar (ex: 400 Bad Request, 403 Forbidden)
    if (!nestResponse.ok) {
        return NextResponse.json({ error: data.message || 'Falha ao salvar a publicação' }, { status: nestResponse.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    // Captura erros do Zod ou falha no parsing
    return NextResponse.json({ error: error.message || 'Payload inválido' }, { status: 400 });
  }
}