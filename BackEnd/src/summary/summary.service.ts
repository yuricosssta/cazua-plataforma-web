//src/summary/summary.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import {
  summaryInstructions,
  ReelAltaireInstructions,
} from './instructions/summary.instructions';
import { IReels } from '../summary/schemas/models/reel.interface';
import { CreateReelDto } from './validations/summary.zod';

@Injectable()
export default class SummaryService {
  private client: OpenAI;
  private readonly logger = new Logger(SummaryService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY não está configurada no .env',
      );
    }

    // this.client = new OpenAI({ apiKey });
    this.client = new OpenAI();
  }

  async summarizeText(text: string): Promise<string> {
    //const padraoResposta = "Você receberá a transcrição completa de um áudio. Sua tarefa é criar um material didático organizado e fiel, **sem adicionar, resumir ou omitir nenhuma informação** do conteúdo original. Siga as instruções abaixo: 1. Inicie com um breve resumo do conteúdo em até 10 linhas. 2. Em seguida, apresente **todo o conteúdo da transcrição de forma organizada**, dividida por tópicos e subtópicos quando necessário. 3. Mantenha a **linguagem formal acessível e clara**, adequada para jovens de 14 a 18 anos. 4. Use **Markdown** para formatar o texto: títulos, subtítulos e listas. 5. Não adicione comentários, ícones ou conteúdo decorativo. 6. **Não invente nem reescreva com outras palavras**: apenas reorganize o conteúdo mantendo todas as ideias e exemplos originais. Sua resposta deve conter apenas o conteúdo em Markdown formatado corretamente. ";

    const padraoResposta = summaryInstructions;
    console.log('Passando instruções...');

    try {
      const response = await this.client.responses.create({
        model: 'gpt-4o-mini',
        input: text,
        // reasoning: { effort: "low" },
        instructions: padraoResposta,
      });

      console.log(response.output_text);
      return response.output_text;
    } catch (error) {
      this.logger.error(
        `Erro ao chamar a agente: ${error.message}`,
        error.stack,
      );

      if (error.status === 429) {
        throw new HttpException(
          'O sistema de IA está temporariamente indisponível (Cota excedida). Tente novamente mais tarde.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        'Erro ao processar o resumo. Entre em contato com o suporte.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async createReels(Reel: CreateReelDto): Promise<string> {
    const padraoResposta = ReelAltaireInstructions(Reel as IReels);
    this.logger.log('Instruções para criação de Reel geradas.');

    try {
      const response = await this.client.responses.create({
        model: 'gpt-4o-mini',
        input: padraoResposta,
        // instructions: padraoResposta,
      });

      return response.output_text;
    } catch (error) {
      this.logger.error(
        `Erro ao chamar a agente: ${error.message}`,
        error.stack,
      );

      if (error.status === 429) {
        throw new HttpException(
          'O sistema de IA está temporariamente indisponível (Cota excedida). Tente novamente mais tarde.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        'Erro ao processar o roteiro. Entre em contato com o suporte.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
