import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { scanRoutes } from './routes/scan.js';
import { endpointRoutes } from './routes/endpoints.js';
import { embedRoutes } from './routes/embed.js';
import { homeRoutes } from './routes/home.js';

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const host = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: true,
});

// Configure CORS and rate limits
await fastify.register(cors, {
  origin: '*',
});

await fastify.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute',
});

// Register route plugins
fastify.register(homeRoutes);
fastify.register(scanRoutes);
fastify.register(endpointRoutes);
fastify.register(embedRoutes);

const start = async () => {
  try {
    await fastify.listen({ port, host });
    console.log(`[API] Server is listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
export default fastify;
