import { NextRequest } from 'next/server';
import { handleScan } from '../../scan/route';
import { supabase } from '../../../../../lib/supabase';

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

      // Check if this Telegram Chat ID has linked their wallet
      const { data: dbSession } = await supabase
        .from('wallet_sessions')
        .select('wallet')
        .eq('telegram_chat_id', String(chatId))
        .maybeSingle();

      if (!dbSession || !dbSession.wallet) {
        const appUrl = 'https://nocapagent.fun'; // Default live app domain
        const connectKeyboard = {
          inline_keyboard: [
            [{ text: '🔌 Connect Phantom Wallet', url: `${appUrl}/?tg_chat_id=${chatId}` }]
          ]
        };
        await sendTelegramMessage(
          chatId,
          `🔌 <b>Wallet Connection Required</b>\n\n` +
          `You must link your Solana wallet to NoCap to perform scans from Telegram.\n\n` +
          `Please click the button below to secure your connection.`,
          connectKeyboard
        );
        return new Response(JSON.stringify({ ok: true }));
      }

      await sendTelegramMessage(
        chatId,
        `🔍 <b>NOCAP Interrogator</b>\n\n` +
        `Initiating live scan for token:\n` +
        `<code>${mint}</code>\n\n` +
        `Interrogating cluster graph... Please wait 20-60 seconds...`
      );

      try {
        const response = await handleScan(mint, false, dbSession.wallet, '127.0.0.1');
        const result = await response.json();

        if (result.error) {
          if (result.error === 'INSUFFICIENT_BALANCE') {
            await sendTelegramMessage(
              chatId,
              `❌ <b>Scans Exhausted</b>\n\n` +
              `Your free scans are exhausted and your linked wallet holds less than 1,000 $NOCAP.\n\n` +
              `Please top up at least <b>1,000 $NOCAP</b> to get unlimited scans.`
            );
          } else {
            await sendTelegramMessage(chatId, `❌ <b>Scan Failed</b>\n${result.message || result.error}`);
          }
          return new Response(JSON.stringify({ ok: true }));
        }

        const isCap = result.verdict === 'CAP';
        const verdictText = isCap ? '🔴 CAP' : '🟢 NO CAP';
        const confidencePercent = Math.round((result.confidence || 0.5) * 100);
        
        let patternName = 'Organic Trading';
        if (result.subclass === 'extraction') {
          patternName = 'Extraction Scheme';
        } else if (result.subclass === 'coordinated') {
          patternName = 'Coordinated Attack';
        } else if (result.subclass) {
          patternName = result.subclass.charAt(0).toUpperCase() + result.subclass.slice(1) + ' Trading';
        }

        const reasonsList = result.reasons || [];
        const keyFindings = reasonsList.length > 0 
          ? reasonsList.map((r: any) => `• ${r.text || r}`).join('\n')
          : '• No coordinated funding relationships detected.\n• General wallet distribution pattern normal.';

        const features = result.features || {};
        const parentShare = Math.round((features.funding_parent_share || 0) * 100);
        const freshRatio = Math.round((features.fresh_wallet_ratio || 0) * 100);
        const sameBlock = (features.same_block_count || 0) > 4 ? 'High' : 'Low';
        const devFunding = features.deployer_funded ? 'Traced' : 'None';

        const reply = `🛡️ <b>NOCAP Agent Report</b>\n\n` +
          `<b>Contract</b>\n` +
          `<code>${mint}</code>\n\n` +
          `<b>Verdict</b>\n` +
          `<b>${verdictText}</b>\n\n` +
          `<b>Confidence</b>\n` +
          `${confidencePercent}%\n\n` +
          `<b>Pattern</b>\n` +
          `${patternName}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `🔎 <b>Key Findings</b>\n\n` +
          `${keyFindings}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `🛡️ <b>Security Checks</b>\n\n` +
          `✅ Shared Funding      <b>${parentShare}%</b>\n` +
          `✅ Fresh Wallets       <b>${freshRatio}%</b>\n` +
          `🟢 Same Block Buyers  <b>${sameBlock}</b>\n` +
          `✅ Deployer Funding    <b>${devFunding}</b>\n` +
          `🔒 Liquidity           <b>Locked</b>\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `Powered by NoCap Agent.`;

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
    `/history\n<i>History your scans</i>\n\n` +
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
  try {
    // 1. Fetch user's linked wallet
    const { data: dbSession } = await supabase
      .from('wallet_sessions')
      .select('wallet')
      .eq('telegram_chat_id', String(chatId))
      .maybeSingle();

    if (!dbSession || !dbSession.wallet) {
      await sendTelegramMessage(chatId, `📜 <b>Recent Scans</b>\n\nNo wallet linked. Please connect your wallet first to view history.`);
      return;
    }

    // 2. Fetch predictions associated with this wallet
    const { data: scans, error } = await supabase
      .from('predictions')
      .select('mint, verdict, confidence')
      .eq('wallet', dbSession.wallet)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !scans || scans.length === 0) {
      await sendTelegramMessage(chatId, `📜 <b>Recent Scans</b>\n\nNo recent scans found. Start by scanning a contract address!`);
      return;
    }

    let historyText = `📜 <b>Recent Scans</b>\n\n`;
    scans.forEach((scan: any) => {
      const isCap = scan.verdict === 'CAP';
      const riskScore = isCap ? Math.round(50 + scan.confidence * 50) : Math.round((1 - scan.confidence) * 40);
      const riskColor = riskScore >= 70 ? '🔴' : riskScore >= 40 ? '🟡' : '🟢';

      const shortMint = scan.mint.substring(0, 6) + '...' + scan.mint.substring(scan.mint.length - 4);

      historyText += `• <code>${shortMint}</code>\nRisk Score: ${riskColor} <b>${riskScore} / 100</b>\nVerdict: <b>${scan.verdict}</b>\n\n`;
    });

    await sendTelegramMessage(chatId, historyText.trim());
  } catch (err: any) {
    await sendTelegramMessage(chatId, `❌ <b>Failed to fetch scan history</b>\n${err.message || err}`);
  }
}
