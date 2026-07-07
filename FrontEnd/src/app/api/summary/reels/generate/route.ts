//src/app/api/summary/reels/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNestApiUrl, getBffAuthHeader, getBffOrgHeaders } from '@/lib/api/serverUtils';
import { createReelSchema } from '@/validations/summary.zod';



export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const parseResult = createReelSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { message: 'Dados inválidos.', errors: parseResult.error.format() },
                { status: 400 }
            );
        }

        const authHeader = await getBffAuthHeader(req);
        const orgHeaders = getBffOrgHeaders(req);

        if (!authHeader) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }

        const apiUrl = getNestApiUrl();

        const fetchHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
        };

        if (orgHeaders.orgId) fetchHeaders['x-org-id'] = orgHeaders.orgId;
        if (orgHeaders.orgRole) fetchHeaders['x-org-role'] = orgHeaders.orgRole;

        const response = await fetch(`${apiUrl}/summary/reels/generate`, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify(parseResult.data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || 'Erro no processamento da IA' },
                { status: response.status }
            );
        }

        const textResult = await response.text();

        return new NextResponse(textResult, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error) {
        console.error('[BFF] Erro em /api/summary/reels/generate:', error);
        return NextResponse.json(
            { message: 'Erro interno no servidor de borda.' },
            { status: 500 }
        );
    }
}