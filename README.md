# 🏗️ SaaS de Gestão Operacional e Logística
> Transformação digital aplicada à infraestrutura urbana e construção civil.

Este sistema foi concebido para eliminar processos manuais e digitalizar 100% da gestão de equipes, maquinários e estoque na administração pública e privada.

## 🌟 Diferenciais Técnicos
- **IA Generativa:** Módulo de processamento de linguagem natural para criação automática de Atas de Reunião e Pareceres Técnicos via OpenAI API.
- **Storage de Alta Performance:** Gestão de evidências fotográficas e documentos técnicos utilizando Cloudflare R2.
- **Arquitetura & Escalabilidade:** Backend construído com NestJS (Arquitetura Modular) e ambiente totalmente conteinerizado com Docker.
- **Resiliência:** Implementação de cache para salvamento de rascunhos em tempo real, garantindo a integridade dos dados em campo.

## 🛠 Tecnologias Utilizadas
- **Frontend:** Next.js (App Router), Tailwind CSS, TypeScript.
- **Backend:** Node.js, NestJS, JWT Auth.
- **Banco de Dados:** MongoDB (ou PostgreSQL para dados relacionais).
- **Infra:** Docker, Docker Compose, Vercel Deploy.

## 📈 Impacto Real
- **Digitalização:** 100% dos processos analógicos migrados para digital.
- **Eficiência:** Redução estimada de 70% no tempo de elaboração de relatórios técnicos e atas através de automação com IA.
- **Sustentabilidade:** Eliminação total do uso de papel na Diretoria Operacional.

## 🚀 Como rodar o projeto
```bash
docker-compose up --build