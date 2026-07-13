import { NextRequest } from 'next/server';
import { handleScan } from '../../scan/route';

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[Telegram Bot] Failed to send message:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message || !message.chat || !message.chat.id) {
      return new Response(JSON.stringify({ ok: true, status: 'ignored' }));
    }

    const chatId = message.chat.id;
    const text = (message.text || '').trim();

    // 1. Welcome and Help commands
    if (text === '/start' || text === '/help') {
      const welcome = `🔍 <b>NOCAP Interrogator Bot</b>\n\n` +
        `Send me any Solana token mint address, and I will analyze it in real-time to check for bundle configurations, creator history, and rug/extraction patterns.\n\n` +
        `<i>Usage: Simply paste the 32-44 character token address below.</i>`;
      await sendTelegramMessage(chatId, welcome);
      return new Response(JSON.stringify({ ok: true }));
    }

    // 2. Validate Solana Mint Address format (Base58, 32 to 44 characters)
    const mintRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (mintRegex.test(text)) {
      const mint = text;
      await sendTelegramMessage(chatId, `🔍 <b>NOCAP Interrogator</b>\n\n` +
        `Initiating live scan for token:\n<code>${mint}</code>\n\n` +
        `<i>Interrogating cluster graph... Please wait 5-10 seconds...</i>`);

      try {
        // Run scan synchronously (bypass gating by sending fake wallet id 'Telegram_Bot')
        const response = await handleScan(mint, false, `Telegram_${chatId}`, '127.0.0.1');
        const result = await response.json();

        if (result.error) {
          await sendTelegramMessage(chatId, `❌ <b>Scan Failed</b>\n${result.message || result.error}`);
          return new Response(JSON.stringify({ ok: true }));
        }

        const isCap = result.verdict === 'CAP';
        const verdictEmoji = isCap ? '🔴 <b>CAP (HIGH RUG RISK)</b>' : '🟢 <b>NO CAP (ORGANIC)</b>';
        const confidencePercent = Math.round(result.confidence * 100);

        let findings = '';
        if (Array.isArray(result.reasons) && result.reasons.length > 0) {
          findings = result.reasons.map((r: any) => `• ${r.text}`).join('\n');
        } else {
          findings = '• No obvious bundle or malicious patterns resolved.';
        }

        const reply = `🔍 <b>NOCAP SCAN REPORT</b>\n\n` +
          `<b>Token Address:</b>\n<code>${mint}</code>\n\n` +
          `<b>Verdict:</b> ${verdictEmoji}\n` +
          `<b>Confidence Level:</b> ${confidencePercent}%\n` +
          `<b>Pattern Type:</b> <code>${result.subclass}</code>\n\n` +
          `<b>Key Findings:</b>\n${findings}`;

        await sendTelegramMessage(chatId, reply);
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ <b>Scan Engine Error</b>\n${err.message || err}`);
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    // 3. Fallback for invalid mint
    if (text.length > 0) {
      const fallback = `⚠️ <b>Invalid Input</b>\n\n` +
        `Please send a valid Solana token mint address (32-44 character base58 string).`;
      await sendTelegramMessage(chatId, fallback);
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
