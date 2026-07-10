import WebSocket from 'ws';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { parsePumpTransaction, PUMP_PROGRAM_ID } from '@nocap/core';

dotenv.config();

function extractApiKey(key: string): string {
  if (!key) return '';
  if (key.includes('api-key=')) {
    return key.split('api-key=')[1]?.split('&')[0] || key;
  }
  return key;
}

const HELIUS_API_KEY = extractApiKey(process.env.HELIUS_API_KEY || '');
import { URL } from 'url';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisUrl = new URL(REDIS_URL);
const connectionOptions = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  password: redisUrl.password || undefined,
  username: redisUrl.username || undefined,
  maxRetriesPerRequest: null,
};

const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Initialize BullMQ Queue
const enrichmentQueue = new Queue('token-enrichment', {
  connection: connectionOptions,
});

async function triggerScan(mint: string, creator: string, socialsExist: boolean) {
  console.log(`[INGESTOR] Triggering scan job for token: ${mint}`);
  await enrichmentQueue.add('enrich-and-score', {
    mint,
    creator,
    socialsExist,
  });
}

// Keep track of active tokens and their creation timeouts
async function checkTimeouts() {
  const activeBuffers = await redis.keys('nocap:buffer:*:metadata');
  const now = Math.floor(Date.now() / 1000);

  for (const metaKey of activeBuffers) {
    const mint = metaKey.split(':')[2];
    const metadata = await redis.hgetall(metaKey);
    if (!metadata || !metadata.createdAt) continue;

    const createdAt = parseInt(metadata.createdAt);
    const count = await redis.llen(`nocap:buffer:${mint}:trades`);

    // If 15 minutes timeout (900 seconds) reached
    if (now - createdAt >= 900) {
      console.log(`[INGESTOR] Timeout (15m) reached for token ${mint}. Flushing with ${count} trades.`);
      await triggerScan(mint, metadata.creator || '', metadata.socialsExist === 'true');
      
      // Clean up keys
      await redis.del(`nocap:buffer:${mint}:metadata`);
      await redis.del(`nocap:buffer:${mint}:trades`);
    }
  }
}

// Run timeout check every 30 seconds
setInterval(checkTimeouts, 30000);

function startWebSocket() {
  if (!HELIUS_API_KEY) {
    console.error('[INGESTOR] HELIUS_API_KEY is not defined. Ingestor will simulate connection.');
    // Simulated mock generator for sandbox testing
    simulateIngestion();
    return;
  }

  const ws = new WebSocket(`wss://atlas.helius-rpc.com?api-key=${HELIUS_API_KEY}`);

  ws.on('open', () => {
    console.log('[INGESTOR] Helius WebSocket connection opened.');
    const subscribeMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'transactionSubscribe',
      params: {
        accountRequired: [PUMP_PROGRAM_ID],
      },
    };
    ws.send(JSON.stringify(subscribeMsg));
  });

  ws.on('message', async (data: string) => {
    try {
      const response = JSON.parse(data);
      if (response.method === 'transactionNotification') {
        const tx = response.params?.result;
        const parsed = parsePumpTransaction(tx);

        if (parsed.type === 'create') {
          const { mint, creator, timestamp } = parsed.data;
          console.log(`[INGESTOR] New Token Created: ${mint} by creator: ${creator}`);

          // Initialize buffer in Redis
          await redis.hmset(`nocap:buffer:${mint}:metadata`, {
            creator,
            createdAt: timestamp.toString(),
            socialsExist: 'true', // assumed for mock, parsed in prod
          });
          // Set TTL to 2 hours to prevent memory leaks
          await redis.expire(`nocap:buffer:${mint}:metadata`, 7200);
        } else if (parsed.type === 'trade') {
          const trade = parsed.data;
          const metadataKey = `nocap:buffer:${trade.mint}:metadata`;
          const exists = await redis.exists(metadataKey);

          if (exists) {
            const tradesKey = `nocap:buffer:${trade.mint}:trades`;
            await redis.rpush(tradesKey, JSON.stringify(trade));
            await redis.expire(tradesKey, 7200);

            const count = await redis.llen(tradesKey);
            console.log(`[INGESTOR] Trade ${count}/20 added for token ${trade.mint}`);

            if (count === 20) {
              const metadata = await redis.hgetall(metadataKey);
              await triggerScan(trade.mint, metadata.creator || '', metadata.socialsExist === 'true');
              
              // Clean up keys
              await redis.del(metadataKey);
              await redis.del(tradesKey);
            }
          }
        }
      }
    } catch (err) {
      console.error('[INGESTOR] Error processing WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[INGESTOR] Helius WebSocket connection closed. Reconnecting in 5s...');
    setTimeout(startWebSocket, 5000);
  });

  ws.on('error', (err) => {
    console.error('[INGESTOR] WebSocket error:', err);
  });
}

// Sandbox simulator for validation/demonstrations
function simulateIngestion() {
  console.log('[INGESTOR] Running in Sandbox Simulator mode.');
}

startWebSocket();
