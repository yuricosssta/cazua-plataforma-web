---
name: proptech-arquitetura
description: "Workflow skill para iniciar sessões técnicas B2B de construção civil (PropTech), validando contexto arquitetural existente antes de propor implementações e atualizando a base de conhecimento ao final do sprint."
user-invocable: true
---

# PropTech Arquitetura SaaS

## Objetivo

Fornecer um fluxo de trabalho determinístico para iniciar e conduzir conversas técnicas sobre este SaaS baseado em micro-serviços, mantendo a integridade arquitetural e priorizando a base de conhecimento do projeto.

## Regras principais

- Priorize o contexto presente nos arquivos de conhecimento do workspace:
  - `documento-arquitetura-vivo.md`
  - `documento-arquitetura-vivo.txt` (durante migração)
  - `BackEnd/all-schemas.txt`
  - `BackEnd/all-controllers.txt`
  - `BackEnd/all-validations.txt`
- Se as definições centrais de stack, schemas e rotas já estiverem presentes, não solicite o documento de arquitetura novamente.
- Se houver mudança drástica de escopo ou falta de informações, peça o `Documento de Arquitetura Vivo` explicitamente.
- Trate como verdade absoluta qualquer regra de negócio que conste no documento de arquitetura.

## Processo de início de sessão

1. Verificar se há contexto suficiente nos arquivos de conhecimento listados.
2. Se encontrar: responda com exatamente:
   - `Contexto de arquitetura identificado na base de conhecimento. Qual o objetivo técnico ou funcional do Sprint atual?`
3. Se não encontrar ou se o pedido indicar mudança de escopo: solicite o documento de arquitetura novamente.
4. Sempre identifique a stack esperada antes de propor código:
   - TypeScript estrito
   - NestJS + Zod + Mongoose + EventEmitter2
   - Next.js App Router + Redux Toolkit
   - Cloudflare R2 (S3 compatible)

## Orientação de implementação

- Antes de detalhar lógica de serviço, valide DTOs com Zod.
- Liste os arquivos a serem atualizados ou criados antes de fornecer código.
- Priorize modularidade: cada funcionalidade deve residir em seu próprio módulo NestJS.
- Evite discussões longas, exemplos descartáveis e linguagem motivacional.
- Use instruções diretas e técnicas.

## Encerramento de sprint

- Ao detectar que a implementação foi concluída ou o problema resolvido, pergunte:
  - `O objetivo deste Sprint foi finalizado?`
- Se o usuário confirmar, gere um Resumo Técnico de Fechamento contendo:
  - Decisões de Arquitetura: mudanças em Schemas, novos módulos ou eventos criados.
  - Definições de Infraestrutura: alterações em rotas, buckets ou variáveis de ambiente.
- Ao finalizar um sprint aprovado, atualize o `documento-arquitetura-vivo.md`.
- Se o workspace ainda usar `documento-arquitetura-vivo.txt`, converta-o para `.md` preservando o conteúdo e a forma.
- Atualize também, quando necessário:
  - `BackEnd/all-controllers.txt`
  - `BackEnd/all-schemas.txt`
  - `BackEnd/all-validations.txt`
- Depois de finalizar o sprint e atualizar o documento de arquitetura, execute o skill `/proptech-linkedin` para gerar a sugestão de post técnico no LinkedIn.
