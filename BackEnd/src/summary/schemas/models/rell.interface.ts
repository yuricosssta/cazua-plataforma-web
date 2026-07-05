//src/summary/schemas/models/rell.interface.ts
export interface IRells {
  id?: string;
  tema: string;
  publico_alvo: string;
  conteudo_tipo: string;
  linha_editorial: string;
  objetivo: string;
  duracao: string;
  tom_voz: string;
  saida: string;
  rascunho: string;
  created_at?: Date | string;
  modified_at?: Date | string;
  image?: string;
  author?: string;
  organizationId?: string;
}