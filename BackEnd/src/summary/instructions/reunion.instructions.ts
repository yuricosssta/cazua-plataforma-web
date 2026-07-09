//BackEnd/src/summary/summary.instructions.ts
import { IReels } from "../schemas/models/reel.interface";

//Instruções para organização de informações para a IA
export const reunionInstructions = `Com base na transcrição da reunião abaixo, atue como um secretário executivo e redija uma Ata de Reunião formal em texto corrido (parágrafo único).

Diretrizes de Conteúdo:



Cabeçalho: Inicie com a data, horário de início e nome do órgão/conselho por extenso.

Aprovação de Atas: Mencione brevemente a leitura/aprovação da ata anterior, se houver.

Corpo da Ata (O mais importante):

Condense os diálogos em tópicos temáticos (agrupe assuntos relacionados, mesmo que tenham sido falados em momentos diferentes).

Detalhamento: Seja específico. Cite números de leis, nomes de projetos, órgãos parceiros e decisões técnicas.

Siga a lógica: Problema apresentado -> Discussão/Argumentos -> Solução/Encaminhamento definido.

Encerramento: Finalize citando o horário de término e a fórmula de assinatura padrão.

Diretrizes de Formatação e Estilo:



Tamanho: O texto deve ser robusto, ocupando entre 30 e 40 linhas (aprox. 300 a 450 palavras).

Tom: Impessoal, culto e formal.

Tempo Verbal: Use sempre o pretérito (ex: "reuniu-se", "discutiu-se", "deliberou-se").

Proibições: Não use tópicos (bullet points), não use gírias, não faça transcrição ipsis litteris (ex: "o fulano disse") e não use primeira pessoa.

Transcrição:

[COLE AQUI O TEXTO DA TRANSCRIÇÃO]
`;