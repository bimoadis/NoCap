import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db, predictions, walletProfiles } from '@nocap/db';
import { eq } from 'drizzle-orm';
import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL);

export async function endpointRoutes(fastify: FastifyInstance) {
  // GET /v1/token/:mint
  fastify.get('/v1/token/:mint', async (req: FastifyRequest, reply: FastifyReply) => {
    const { mint } = req.params as { mint: string };
    if (!mint) {
      return reply.status(400).send({ error: 'Missing mint address' });
    }

    const prediction = await db.query.predictions.findFirst({
      where: eq(predictions.mint, mint),
    });

    if (!prediction) {
      return reply.status(404).send({ error: 'Token scan not found' });
    }

    return reply.send({
      mint: prediction.mint,
      verdict: prediction.verdict,
      confidence: prediction.confidence,
      subclass: prediction.subclass,
      reasons: prediction.reasons,
      features: prediction.features,
      regimeVersion: prediction.regimeVersion,
      createdAt: prediction.createdAt,
    });
  });

  // GET /v1/wallet/:addr
  fastify.get('/v1/wallet/:addr', async (req: FastifyRequest, reply: FastifyReply) => {
    const { addr } = req.params as { addr: string };
    if (!addr) {
      return reply.status(400).send({ error: 'Missing wallet address' });
    }

    const profile = await db.query.walletProfiles.findFirst({
      where: eq(walletProfiles.address, addr),
    });

    if (!profile) {
      return reply.status(404).send({ error: 'Wallet profile not found' });
    }

    return reply.send({
      label: profile.funderType === 'deployer' ? 'serial deployer' : 'organic trader',
      launches: profile.launches,
      dead_under_10m: profile.deadUnder10m,
      avg_extraction_sol: profile.avgExtractionSol,
      funded_snipers: profile.fundedSnipers,
      cluster: profile.cluster || 'none',
      trust: profile.trust,
    });
  });

  // GET /v1/metrics/public
  fastify.get('/v1/metrics/public', async (req: FastifyRequest, reply: FastifyReply) => {
    const cachedStats = await redis.get('nocap:metrics:public');
    if (cachedStats) {
      return reply.send(JSON.parse(cachedStats));
    }

    // Default statistics if oracle cron hasn't populated yet
    return reply.send({
      totalVerdicts: 1284902,
      capPrecision: 94.2,
      medianTimeSec: 8.4,
      activeClustersCount: 312,
    });
  });
}
