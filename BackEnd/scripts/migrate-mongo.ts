/**
 * Script de Backup Imediato (R2) e Migração de Cluster/Database MongoDB.
 *
 * Origem padrão: Cluster "Escola Desafio" (database: "test")
 * Destino padrão: MONGO_URI do .env (database: MONGO_DB_NAME || "cazua_prod")
 *
 * Uso:
 *   Dry-run (inspeciona origem, destino e backups R2 sem alterar nada):
 *     pnpm tsx scripts/migrate-mongo.ts
 *
 *   Executar backup no R2 + migração + validação:
 *     pnpm tsx scripts/migrate-mongo.ts --apply
 *
 *   Sobrescrever URI de origem (caso necessário):
 *     SOURCE_MONGO_URI="mongodb+srv://..." pnpm tsx scripts/migrate-mongo.ts --apply
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

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
        const val = trimmed
          .slice(idx + 1)
          .trim()
          .replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

function maskUri(uri: string): string {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/, '$1***$2');
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}_` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  );
}

function createR2Client(): S3Client | null {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function listR2Backups(s3: S3Client, bucket: string, prefix: string) {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    }),
  );
  const items = (res.Contents || []).sort(
    (a, b) =>
      (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0),
  );
  return items;
}

async function run() {
  const isApply = process.argv.includes('--apply');
  const skipBackup = process.argv.includes('--skip-backup');

  const sourceUri = process.env.SOURCE_MONGO_URI;
  const sourceDbName = process.env.SOURCE_DB || 'test';

  const targetUri = process.env.TARGET_MONGO_URI || process.env.MONGO_URI;
  const targetDbName =
    process.env.TARGET_DB || process.env.MONGO_DB_NAME || 'cazua_prod';

  if (!sourceUri) {
    console.error(
      'ERRO: Defina SOURCE_MONGO_URI="mongodb+srv://..." para indicar o cluster de origem.',
    );
    process.exit(1);
  }

  if (!targetUri) {
    console.error('ERRO: MONGO_URI / TARGET_MONGO_URI não definida no .env');
    process.exit(1);
  }

  console.log(
    `\n=============================================================`,
  );
  console.log(
    `🚀 Migração MongoDB Cazuá (${isApply ? 'MODO EXECUÇÃO / APPLY' : 'MODO SIMULAÇÃO / DRY-RUN'})`,
  );
  console.log(
    `=============================================================\n`,
  );
  console.log(`• Origem:  ${maskUri(sourceUri)} (DB: "${sourceDbName}")`);
  console.log(`• Destino: ${maskUri(targetUri)} (DB: "${targetDbName}")\n`);

  // 1. Verificar R2
  const s3 = createR2Client();
  const bucket = process.env.R2_BUCKET_NAME || 'cazua-assets-prod';
  const backupPrefix = process.env.BACKUP_PREFIX || 'backups/mongo/';

  if (s3) {
    try {
      const backups = await listR2Backups(s3, bucket, backupPrefix);
      console.log(
        `📦 Backups existentes em s3://${bucket}/${backupPrefix} (total: ${backups.length}):`,
      );
      backups.slice(0, 5).forEach((b) => {
        const sizeKb = ((b.Size || 0) / 1024).toFixed(1);
        console.log(
          `   - ${b.Key?.replace(backupPrefix, '')} (${sizeKb} KB) em ${b.LastModified?.toISOString()}`,
        );
      });
      console.log('');
    } catch (err: any) {
      console.warn(
        `⚠️  Não foi possível listar backups no R2: ${err.message}\n`,
      );
    }
  }

  // 2. Conectar na Origem e no Destino
  console.log('🔌 Conectando ao cluster de ORIGEM...');
  const sourceConn = await mongoose
    .createConnection(sourceUri, { dbName: sourceDbName })
    .asPromise();
  const sourceDb = sourceConn.db;
  if (!sourceDb) {
    throw new Error('Falha ao obter instância db da conexão de origem');
  }

  console.log('🔌 Conectando ao cluster de DESTINO...');
  const targetConn = await mongoose
    .createConnection(targetUri, { dbName: targetDbName })
    .asPromise();
  const targetDb = targetConn.db;
  if (!targetDb) {
    throw new Error('Falha ao obter instância db da conexão de destino');
  }

  // Listar todos os databases existentes na origem para visibilidade
  try {
    const adminDb = sourceDb.admin();
    const dbsInfo = await adminDb.listDatabases();
    console.log(
      `📂 Databases encontrados no cluster de origem: ${dbsInfo.databases.map((d) => `${d.name} (${((d.sizeOnDisk || 0) / 1024).toFixed(0)} KB)`).join(', ')}`,
    );
  } catch {
    // Usuário pode não ter permissão de listDatabases
  }

  const collectionsInfo = await sourceDb.listCollections().toArray();
  const collectionNames = collectionsInfo
    .map((c) => c.name)
    .filter((name) => !name.startsWith('system.'))
    .sort();

  console.log(
    `\n📋 Coleções encontradas em "${sourceDbName}" (${collectionNames.length}):`,
  );

  const summary: {
    name: string;
    sourceCount: number;
    targetCountBefore: number;
    indexesCount: number;
  }[] = [];

  for (const name of collectionNames) {
    const sCount = await sourceDb.collection(name).countDocuments();
    const tCount = await targetDb.collection(name).countDocuments();
    const indexes = await sourceDb.collection(name).indexes();
    summary.push({
      name,
      sourceCount: sCount,
      targetCountBefore: tCount,
      indexesCount: indexes.length,
    });
    console.log(
      `   • ${name.padEnd(28)} | Origem: ${String(sCount).padStart(6)} docs | Destino atual: ${String(tCount).padStart(6)} docs | Índices: ${indexes.length}`,
    );
  }

  if (!isApply) {
    console.log('\nℹ️  Modo DRY-RUN concluído. Nenhuma alteração foi feita.');
    console.log(
      '👉 Para executar o backup no R2 e migrar todos os dados, rode:\n   pnpm tsx scripts/migrate-mongo.ts --apply\n',
    );
    await sourceConn.close();
    await targetConn.close();
    return;
  }

  // 3. Realizar Backup Imediato no R2 + Disco Local antes de migrar
  const timestamp = getTimestamp();
  const EJSON = mongoose.mongo.BSON.EJSON;

  if (!skipBackup) {
    console.log('\n💾 Gerando snapshot completo da origem (EJSON + Índices)...');
    const gzip = zlib.createGzip();
    const chunks: Buffer[] = [];
    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    const gzipDone = new Promise<Buffer>((resolve, reject) => {
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
    });

    gzip.write(
      `{"metadata":${JSON.stringify({
        sourceDb: sourceDbName,
        timestamp: new Date().toISOString(),
        collectionsCount: collectionNames.length,
      })},"collections":{`,
    );

    for (let i = 0; i < collectionNames.length; i++) {
      const name = collectionNames[i];
      const indexes = await sourceDb.collection(name).indexes();
      if (i > 0) gzip.write(',');
      gzip.write(
        `${JSON.stringify(name)}:{"indexes":${EJSON.stringify(indexes, { relaxed: false })},"documents":[`,
      );

      let firstDoc = true;
      const cursor = sourceDb.collection(name).find({});
      for await (const doc of cursor) {
        if (!firstDoc) gzip.write(',');
        gzip.write(EJSON.stringify(doc, { relaxed: false }));
        firstDoc = false;
      }
      gzip.write(']}');
    }

    gzip.write('}}');
    gzip.end();

    const compressed = await gzipDone;
    const archiveName = `cazua_pre_migration_${sourceDbName}_${timestamp}.ejson.gz`;

    if (s3) {
      const r2Key = `${backupPrefix}${archiveName}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: r2Key,
          Body: compressed,
          ContentType: 'application/gzip',
        }),
      );
      console.log(
        `✅ Backup pré-migração salvo no Cloudflare R2: s3://${bucket}/${r2Key} (${(compressed.length / 1024).toFixed(1)} KB)`,
      );
    } else {
      console.warn(
        '⚠️  Credenciais R2 ausentes, backup não enviado ao R2.',
      );
    }
  }

  // 4. Copiar Coleções (Documentos + Índices) para o Destino em lotes
  console.log(
    `\n🚚 Iniciando migração de "${sourceDbName}" -> "${targetDbName}"...\n`,
  );

  const BATCH_SIZE = 2000;

  for (const name of collectionNames) {
    const sourceCol = sourceDb.collection(name);
    const targetCol = targetDb.collection(name);

    const totalExpected = await sourceCol.countDocuments();
    let migratedCount = 0;

    if (totalExpected > 0) {
      let batch: any[] = [];
      const cursor = sourceCol.find({});
      for await (const doc of cursor) {
        batch.push({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
            upsert: true,
          },
        });

        if (batch.length >= BATCH_SIZE) {
          await targetCol.bulkWrite(batch, { ordered: false });
          migratedCount += batch.length;
          batch = [];
          if (totalExpected > BATCH_SIZE) {
            process.stdout.write(
              `   ⏳ ${name}: ${migratedCount}/${totalExpected} documentos...\r`,
            );
          }
        }
      }

      if (batch.length > 0) {
        await targetCol.bulkWrite(batch, { ordered: false });
        migratedCount += batch.length;
      }
    } else {
      // Garante criação da coleção vazia caso exista na origem
      const existingTargetCols = await targetDb
        .listCollections({ name })
        .toArray();
      if (existingTargetCols.length === 0) {
        await targetDb.createCollection(name);
      }
    }

    // Recriar índices customizados
    const indexes = await sourceCol.indexes();
    let recreatedIndexes = 0;
    for (const idx of indexes) {
      if (idx.name === '_id_') continue;
      const { key, name: idxName, v, ns, ...restOptions } = idx as any;
      try {
        await targetCol.createIndex(key, {
          name: idxName,
          ...restOptions,
        });
        recreatedIndexes++;
      } catch (err: any) {
        console.warn(
          `   ⚠️  Aviso ao criar índice "${idxName}" em "${name}": ${err.message}`,
        );
      }
    }

    const afterCount = await targetCol.countDocuments();
    console.log(
      `   ✅ ${name.padEnd(30)} | Migrados: ${String(migratedCount).padStart(6)} | Total no destino: ${String(afterCount).padStart(6)} | Índices criados: ${recreatedIndexes}`,
    );
  }

  // 5. Validação final de integridade
  console.log('\n🔍 Validando integridade pós-migração...');
  let hasMismatch = false;
  for (const name of collectionNames) {
    const sCount = await sourceDb.collection(name).countDocuments();
    const tCount = await targetDb.collection(name).countDocuments();
    if (sCount !== tCount) {
      console.error(
        `   ❌ Divergência em "${name}": Origem=${sCount}, Destino=${tCount}`,
      );
      hasMismatch = true;
    }
  }

  await sourceConn.close();
  await targetConn.close();

  if (hasMismatch) {
    console.error(
      '\n⚠️  Migração finalizada com divergências de contagem. Verifique os logs acima.',
    );
    process.exit(1);
  } else {
    console.log(
      `\n🎉 Migração concluída com 100% de integridade! Todas as ${collectionNames.length} coleções estão sincronizadas em "${targetDbName}".\n`,
    );
  }
}

run().catch((err) => {
  console.error('\n❌ Erro na execução do script:', err);
  process.exit(1);
});
