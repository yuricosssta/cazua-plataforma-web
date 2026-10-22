/**
 * Script de normalização de e-mails para lowercase.
 *
 * Modo padrão (seguro / dry-run):
 *   pnpm tsx scripts/normalize-emails.ts
 *
 * Modo de aplicação:
 *   pnpm tsx scripts/normalize-emails.ts --apply
 */

import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERRO: MONGO_URI não definida no .env');
    process.exit(1);
  }

  const isApply = process.argv.includes('--apply');
  console.log(`\n=== Normalização de E-mails (${isApply ? 'APLICAÇÃO' : 'DRY-RUN'}) ===\n`);

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    console.error('ERRO: Conexão com o banco não estabelecida');
    process.exit(1);
  }

  const usersCollection = db.collection('users');
  const allUsers = await usersCollection.find({}, { projection: { email: 1, name: 1 } }).toArray();

  console.log(`Total de usuários encontrados no banco: ${allUsers.length}`);

  const emailsToNormalize: { id: any; original: string; normalized: string; name: string }[] = [];
  const normalizedMap = new Map<string, string[]>();

  for (const user of allUsers) {
    if (!user.email) continue;
    const original = user.email;
    const normalized = original.trim().toLowerCase();

    if (!normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, []);
    }
    normalizedMap.get(normalized)!.push(original);

    if (original !== normalized) {
      emailsToNormalize.push({
        id: user._id,
        original,
        normalized,
        name: user.name,
      });
    }
  }

  console.log(`Usuários com letras maiúsculas ou espaços no e-mail: ${emailsToNormalize.length}\n`);

  // Detectar colisões (ex: "fulano@x.com" e "Fulano@x.com" ambos existentes)
  const collisions: string[] = [];
  for (const [normalized, originals] of normalizedMap.entries()) {
    if (originals.length > 1) {
      collisions.push(`${normalized} -> [${originals.join(', ')}]`);
    }
  }

  if (collisions.length > 0) {
    console.warn('⚠️  ATENÇÃO: Colisões encontradas (requer resolução manual):');
    collisions.forEach((c) => console.warn(`   • ${c}`));
    console.log('');
  } else {
    console.log('✅ Nenhuma colisão de e-mail detectada.\n');
  }

  if (emailsToNormalize.length === 0) {
    console.log('Todos os e-mails já estão normalizados em lowercase.');
    await mongoose.disconnect();
    return;
  }

  console.log('Exemplos de normalização:');
  emailsToNormalize.slice(0, 10).forEach((item) => {
    console.log(`  • "${item.original}" -> "${item.normalized}" (${item.name})`);
  });

  if (!isApply) {
    console.log('\nNenhuma alteração foi realizada (modo dry-run).');
    console.log('Para aplicar as alterações, execute: pnpm tsx scripts/normalize-emails.ts --apply\n');
  } else {
    let updatedCount = 0;
    for (const item of emailsToNormalize) {
      // Se houver colisão para este e-mail, pula por segurança
      if (normalizedMap.get(item.normalized)!.length > 1) {
        console.warn(`PULANDO ${item.original} devido a colisão existente.`);
        continue;
      }

      await usersCollection.updateOne(
        { _id: item.id },
        { $set: { email: item.normalized } },
      );
      updatedCount++;
    }
    console.log(`\n✅ Sucesso: ${updatedCount} e-mails atualizados para lowercase.\n`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Erro na execução do script:', err);
  process.exit(1);
});
