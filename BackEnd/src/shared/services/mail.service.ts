//src/shared/services/mail.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Contorno para redes Docker/WSL ou proxies locais que interceptam a camada SSL
        rejectUnauthorized: false,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    appName?: string,
  ): Promise<void> {
    try {
      const subject = appName
        ? `Recuperação de Senha - ${appName} (Sistema Cazuá)`
        : 'Recuperação de Senha - Sistema Cazuá';

      const description = appName
        ? `Você solicitou a redefinição de senha da sua conta de acesso utilizada no <strong>${appName}</strong>.`
        : 'Você solicitou a redefinição de sua senha.';

      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject,
        text: `Você solicitou a redefinição de senha${appName ? ` para ${appName}` : ''}. Acesse o link para criar uma nova senha: ${resetUrl}`,
        html: `
          <h3>Sistema Cazuá</h3>
          <p>${description}</p>
          <p><a href="${resetUrl}" target="_blank">Clique aqui para criar uma nova senha</a></p>
          <p><em>Este link é válido por 1 hora.</em></p>
          <p>Se você não solicitou esta alteração, ignore este e-mail. Nenhuma mudança será feita na sua conta.</p>
        `,
      });
      this.logger.log(
        `E-mail transacional de recuperação enviado para ${email}`,
      );
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail transacional', error);
      throw new InternalServerErrorException(
        'Falha de infraestrutura ao enviar e-mail.',
      );
    }
  }
}
