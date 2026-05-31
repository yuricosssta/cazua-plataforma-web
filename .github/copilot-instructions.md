---
name: proptech-arquitetura-instructions
description: "Instruções de projeto para ativar o fluxo proptech-arquitetura e manter a base de conhecimento de arquitetura atualizada no workspace."
applyTo: "**/*"
---

Use este workspace como um SaaS PropTech B2B com arquitetura de micro-serviços e foco em eventos.

- Priorize a base de conhecimento do workspace antes de sugerir mudanças ou pedir documentação adicional.
- Contexto principal:
  - `documento-arquitetura-vivo.md` (ou `documento-arquitetura-vivo.txt` enquanto houver migração)
  - `BackEnd/all-schemas.txt`
  - `BackEnd/all-controllers.txt`
  - `BackEnd/all-validations.txt`
- Ao iniciar um novo sprint ou planejar mudanças arquiteturais, utilize o skill `/proptech-arquitetura`.
- Não peça o documento de arquitetura vivo se as definições centrais já estiverem presentes no workspace.
- Trate as regras de negócio do documento de arquitetura como verdade absoluta para a sessão.
- Mantenha a stack esperada:
  - TypeScript estrito
  - NestJS + Zod + Mongoose + EventEmitter2
  - Next.js App Router + Redux Toolkit
  - Cloudflare R2 (S3 compatible)

## Atualização de artefatos pós-sprint

- Quando um sprint for aprovado e concluído, atualize o `documento-arquitetura-vivo.md`.
- Se o arquivo ainda existir como `documento-arquitetura-vivo.txt`, converta-o para `.md` preservando o conteúdo e o histórico de decisões.
- Atualize também, quando necessário:
  - `BackEnd/all-controllers.txt`
  - `BackEnd/all-schemas.txt`
  - `BackEnd/all-validations.txt`

## Comportamento esperado

- Seja direto, técnico e objetivo.
- Valide DTOs com Zod antes de detalhar lógica de serviço.
- Liste os arquivos que serão criados ou modificados antes de fornecer código.
- Priorize modularidade e separação de responsabilidades em módulos NestJS.
