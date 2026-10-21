import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export function swaggerBasicAuth(expectedUser: string, expectedPass: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Cazua API Docs"');
      return res.status(401).send('Acesso não autorizado.');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Cazua API Docs"');
      return res.status(401).send('Credenciais inválidas.');
    }

    const usernameMatch = safeCompare(username, expectedUser);
    const passwordMatch = safeCompare(password, expectedPass);

    if (usernameMatch && passwordMatch) {
      return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Cazua API Docs"');
    return res.status(401).send('Credenciais incorretas.');
  };
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
