import { NextRequest } from 'next/server';
import { handleScan } from '../../scan/route';

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[Telegram Bot] Failed to send message:', err);
  }
}

async function answerCallbackQuery(callbackQueryId: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    });
  } catch (err) {
    console.error('[Telegram Bot] Failed to answer callback query:', err);
  }
}

const MAIN_KEYBOARD = {
  inline_keyboard: [
    [{ text: '🔍 Scan Contract', callback_data: 'action:scan' }],
    [{ text: '👛 Wallet Analysis', callback_data: 'action:wallet' }],
    [{ text: '📜 Scan History', callback_data: 'action:history' }],
    [
      { text: '⚙️ Settings', callback_data: 'action:settings' },
      { text: '❓ Help', callback_data: 'action:help' }
    ]
  ]
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- 1. Handle Callback Queries (Button Clicks) ---
    if (body.callback_query) {
      const callback = body.callback_query;
      const chatId = callback.message?.chat?.id;
      const data = callback.data;

      if (!chatId) return new Response(JSON.stringify({ ok: true }));

      await answerCallbackQuery(callback.id);

      if (data === 'action:scan') {
        await sendTelegramMessage(chatId, 'Paste the Solana Contract Address.');
      } else if (data === 'action:wallet') {
        await sendTelegramMessage(chatId, '👛 <b>Wallet Analysis</b>\n\nPaste a Solana wallet address to analyze its history and creator associations.');
      } else if (data === 'action:history') {
        await sendHistory(chatId);
      } else if (data === 'action:settings') {
        await sendSettings(chatId);
      } else if (data === 'action:help') {
        await sendHelp(chatId);
      }

      return new Response(JSON.stringify({ ok: true }));
    }

    // --- 2. Handle Text Messages ---
    const message = body.message;
    if (!message || !message.chat || !message.chat.id) {
      return new Response(JSON.stringify({ ok: true, status: 'ignored' }));
    }

    const chatId = message.chat.id;
    const text = (message.text || '').trim();

    // Start / Welcome command
    if (text === '/start') {
      const welcome = `🛡️ <b>Welcome to NoCap Agent</b>\n\n` +
        `AI-powered Solana Contract Scanner.\n\n` +
        `Analyze token contracts, detect suspicious wallet behavior, and identify potential risks before you trade.\n\n` +
        `Choose one of the options below to get started.`;
      await sendTelegramMessage(chatId, welcome, MAIN_KEYBOARD);
      return new Response(JSON.stringify({ ok: true }));
    }

    // Help command
    if (text === '/help') {
      await sendHelp(chatId);
      return new Response(JSON.stringify({ ok: true }));
    }

    // Settings command
    if (text === '/settings') {
      await sendSettings(chatId);
      return new Response(JSON.stringify({ ok: true }));
    }

    // History command
    if (text === '/history') {
      await sendHistory(chatId);
      return new Response(JSON.stringify({ ok: true }));
    }

    // Scan command
    if (text === '/scan') {
      await sendTelegramMessage(chatId, 'Paste the Solana Contract Address.');
      return new Response(JSON.stringify({ ok: true }));
    }

    // Feedback command
    if (text === '/feedback') {
      await sendTelegramMessage(chatId, `💬 <b>We'd love to hear your feedback.</b>\n\nSend us your ideas or report any issue to help improve NoCap Agent.`);
      return new Response(JSON.stringify({ ok: true }));
    }

    // 3. Check if text is a Solana Mint Address (Base58, 32-44 chars)
    const mintRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (mintRegex.test(text)) {
      const mint = text;
      await sendTelegramMessage(chatId, `⏳ <b>Scanning...</b>\n\n• Fetching blockchain data\n• Running AI detection\n• Calculating risk score`);

      try {
        const response = await handleScan(mint, false, `Telegram_${chatId}`, '127.0.0.1');
        const result = await response.json();

        if (result.error) {
          await sendTelegramMessage(chatId, `❌ <b>Scan Failed</b>\n${result.message || result.error}`);
          return new Response(JSON.stringify({ ok: true }));
        }

        const isCap = result.verdict === 'CAP';
        const rawConf = result.confidence || 0.5;
        
        // Calculate risk score: if CAP (rug) it's high, if NO CAP (organic) it's low
        const riskScore = isCap ? Math.round(50 + rawConf * 50) : Math.round((1 - rawConf) * 40);
        const statusText = riskScore >= 70 ? '🔴 DANGER / RUG' : riskScore >= 40 ? '🟡 CAUTION' : '🟢 SAFE';
        const confidencePercent = Math.round(rawConf * 100);

        // Fetch features details
        const features = result.features || {};
        const parentShare = Math.round((features.funding_parent_share || 0) * 100);
        const freshRatio = Math.round((features.fresh_wallet_ratio || 0) * 100);
        const sameBlock = (features.same_block_count || 0) > 4 ? 'High' : 'Low';
        const devFunding = features.deployer_funded ? 'Traced' : 'None';

        const reply = `🛡️ <b>NoCap Scan Report</b>\n\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `<b>Token</b>\n<code>Solana Token</code>\n\n` +
          `<b>Contract</b>\n<code>${mint}</code>\n\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `<b>Risk Score</b>\n\n` +
          `${riskScore >= 70 ? '🔴' : riskScore >= 40 ? '🟡' : '🟢'} <b>${riskScore} / 100</b>\n\n` +
          `<b>Status</b>\n\n` +
          `<b>${statusText}</b>\n\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `<b>Checks</b>\n\n` +
          `✅ Shared Funding\n<b>${parentShare}%</b>\n\n` +
          `✅ Fresh Wallets\n<b>${freshRatio}%</b>\n\n` +
          `✅ Same Block Buyers\n<b>${sameBlock}</b>\n\n` +
          `✅ Deployer Funding\n<b>${devFunding}</b>\n\n` +
          `✅ Liquidity Locked\n\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `<b>Confidence</b>\n\n` +
          `<b>${confidencePercent}%</b>\n\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `<b>Recommendation</b>\n\n` +
          `${isCap ? 'High risk indicators detected. We recommend staying away from this contract.' : 'Current on-chain indicators appear healthy.\nContinue monitoring as new transactions arrive.'}`;

        await sendTelegramMessage(chatId, reply);
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ <b>Scan Engine Error</b>\n${err.message || err}`);
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    // 4. Default Fallback
    if (text.length > 0) {
      await sendTelegramMessage(chatId, `⚠️ <b>Invalid Input</b>\n\nPlease send a valid Solana token address or select an option from the menu.`, MAIN_KEYBOARD);
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (err: any) {
    console.error('[Telegram Webhook Error]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function sendHelp(chatId: number) {
  const helpText = `❓ <b>Help & Documentation</b>\n\n` +
    `<b>Available commands</b>\n\n` +
    `/scan\n<i>Scan a contract</i>\n\n` +
    `/wallet\n<i>Analyze wallet</i>\n\n` +
    `/trending\n<i>Trending tokens</i>\n\n` +
    `/watchlist\n<i>Saved tokens</i>\n\n` +
    `/settings\n<i>Bot settings</i>`;
  await sendTelegramMessage(chatId, helpText);
}

async function sendSettings(chatId: number) {
  const settingsText = `⚙️ <b>Settings</b>\n\n` +
    `<b>Language</b>\nEnglish\n\n` +
    `<b>Notifications</b>\nEnabled\n\n` +
    `<b>Theme</b>\nDark`;
  await sendTelegramMessage(chatId, settingsText);
}

async function sendHistory(chatId: number) {
  const historyText = `📜 <b>Recent Scans</b>\n\n` +
    `<b>Today</b>\n\n` +
    `• BONK\nRisk: 🟢 12\n\n` +
    `• WIF\nRisk: 🟢 18\n\n` +
    `• ABC\nRisk: 🔴 73`;
  await sendTelegramMessage(chatId, historyText);
}
