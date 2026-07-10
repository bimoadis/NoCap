import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function homeRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    // Resolve absolute path to root workspace file
    const filePath = path.resolve(__dirname, '../../../../nocap_website_1.html');
    
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Mockup HTML page not found' });
    }

    const stream = fs.createReadStream(filePath);
    return reply.type('text/html').send(stream);
  });
}
