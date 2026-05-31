# PropTech Arquitetura - Fluxo de Uso

Este diretório contém customizações de Copilot para este workspace.

## Objetivo

Centralizar as regras de arquitetura e o fluxo de finalização de sprint para o SaaS PropTech B2B.

## Arquivos principais

- `.github/copilot-instructions.md`
  - Instruções de projeto globais para o workspace.
  - Ativa o comportamento padrão de arquitetura e faz com que o agente priorize a base de conhecimento do projeto.
- `.github/skills/proptech-arquitetura/SKILL.md`
  - Skill acionável para iniciar sessões técnicas e validar o contexto arquitetural.
  - Usa o contexto de `documento-arquitetura-vivo.md`, `BackEnd/all-schemas.txt`, `BackEnd/all-controllers.txt` e `BackEnd/all-validations.txt`.

## Como usar

1. Abra o chat do Copilot.
2. Execute o skill via slash command:
   - `/proptech-arquitetura`
3. O skill deve identificar se há contexto arquitetural disponível e iniciar a conversa com:
   - `Contexto de arquitetura identificado na base de conhecimento. Qual o objetivo técnico ou funcional do Sprint atual?`

## Protocolo de finalização de sprint

Ao concluir um sprint aprovado, a skill deve:

- Atualizar `documento-arquitetura-vivo.md`.
- Converter `documento-arquitetura-vivo.txt` para `.md` se ainda estiver em uso.
- Atualizar também, quando necessário:
  - `BackEnd/all-controllers.txt`
  - `BackEnd/all-schemas.txt`
  - `BackEnd/all-validations.txt`

## Quando usar este workflow

- Planejamento de novas features de backend ou frontend.
- Mudanças na arquitetura de micro-serviços.
- Atualização de contratos, rotas e validações compartilhadas.
- Sprint aprovada que impacta rotas, schemas ou regras de negócio.
