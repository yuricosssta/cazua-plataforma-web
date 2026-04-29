//src/resources/types/resource-enums.ts
export enum ResourceType {
  MATERIAL = 'MATERIAL',   // Cimento, areia, brita
  LABOR = 'LABOR',         // Pedreiro, Equipe 1, Engenheiro
  EQUIPMENT = 'EQUIPMENT', // Betoneira, Caminhão
  CAPITAL = 'CAPITAL',     // Verba em dinheiro
}

export enum TransactionType {
  ENTRY = 'ENTRY',           // Entrada no Almoxarifado Central
  ALLOCATION = 'ALLOCATION', // Envio para uma Obra específica
  RETURN = 'RETURN',         // Devolução da Obra para o Almoxarifado
}

export enum TransactionStatus {
  PENDING = 'PENDING',   // Solicitado pela obra, aguardando almoxarifado
  APPROVED = 'APPROVED', // Aprovado e baixado do estoque
  REJECTED = 'REJECTED', // Negado pelo almoxarifado
}