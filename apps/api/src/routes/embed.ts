import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function embedRoutes(fastify: FastifyInstance) {
  fastify.get('/embed', async (req: FastifyRequest, reply: FastifyReply) => {
    const { mint } = req.query as { mint: string };
    if (!mint) {
      return reply.status(400).type('text/html').send('<h3>Missing mint address</h3>');
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --bg: #0c1119;
      --border: rgba(148, 176, 224, 0.15);
      --ink: #eef3fa;
      --dim: #93a0b4;
      --emerald: #3ce6a4;
      --red: #ff5470;
      --cyan: #53d9ff;
    }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 320px;
      box-sizing: border-box;
    }
    .verdict-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verdict-chip {
      font-size: 28px;
      font-weight: bold;
      border: 2px solid currentColor;
      padding: 4px 14px;
      letter-spacing: 0.05em;
    }
    .verdict-chip.cap { color: var(--red); text-shadow: 0 0 10px rgba(255, 84, 112, 0.3); }
    .verdict-chip.nocap { color: var(--emerald); text-shadow: 0 0 10px rgba(60, 230, 164, 0.3); }
    .verdict-chip.loading { color: var(--cyan); border-style: dashed; }
    .reason {
      font-size: 13px;
      color: var(--dim);
      line-height: 1.4;
    }
    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
      overflow: hidden;
      display: none;
    }
    .progress-bar i {
      display: block;
      height: 100%;
      background: var(--cyan);
      width: 0%;
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="verdict-header">
    <div id="verdictChip" class="verdict-chip loading">SCANNING</div>
    <div id="confidence" style="font-size: 14px; font-weight: bold; color: var(--dim);">--</div>
  </div>
  <div id="progressBar" class="progress-bar"><i></i></div>
  <div id="reason" class="reason">Interrogating funding graph logs...</div>

  <script>
    const mint = "${mint}";
    const chip = document.getElementById('verdictChip');
    const pbar = document.getElementById('progressBar');
    const pfill = pbar.querySelector('i');
    const rsn = document.getElementById('reason');
    const conf = document.getElementById('confidence');

    pbar.style.display = 'block';

    const es = new EventSource('/v1/scan?mint=' + mint + '&stream=true');

    es.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      pfill.style.width = data.pct + '%';
      rsn.textContent = 'Step: ' + data.step + ' (' + data.pct + '%)';
    });

    es.addEventListener('cluster', (e) => {
      const data = JSON.parse(e.data);
      rsn.textContent = 'Cluster ' + data.id + ' resolved: ' + data.wallets + ' wallets funded by parent.';
    });

    es.addEventListener('verdict', (e) => {
      const data = JSON.parse(e.data);
      pbar.style.display = 'none';
      chip.className = 'verdict-chip ' + (data.verdict === 'CAP' ? 'cap' : 'nocap');
      chip.textContent = data.verdict;
      conf.textContent = 'CONFIDENCE ' + (data.confidence * 100).toFixed(0) + '%';
      rsn.textContent = data.reason || (data.verdict === 'CAP' ? 'Supply pattern controlled.' : 'Organic trading flow confirmed.');
      es.close();
    });

    es.onerror = () => {
      rsn.textContent = 'Scan failed or connection closed.';
      pbar.style.display = 'none';
      es.close();
    };
  </script>
</body>
</html>
    `;

    return reply.type('text/html').send(htmlContent);
  });
}
