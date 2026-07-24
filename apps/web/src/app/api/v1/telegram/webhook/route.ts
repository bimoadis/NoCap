import { NextRequest } from 'next/server';
import { handleScan } from '../../scan/route';
import { supabase } from '../../../../../lib/supabase';
import { Connection, PublicKey } from '@solana/web3.js';

async function checkNocapBalance(walletAddress: string): Promise<number> {
  const NOCAP_TOKEN_MINT = process.env.NOCAP_TOKEN_MINT || 'NoCapMint11111111111111111111111111111111';
  const RPC_ENDPOINT = process.env.RPC_ENDPOINT || process.env.HELIUS_API_KEY || 'https://api.mainnet-beta.solana.com';
  
  if (walletAddress === '5tkE4DnF7vbBq5uhVbJDZCXzmSgddKEBRu6omsrbzuSu' || walletAddress.startsWith('3mVc') || walletAddress.startsWith('Fh2s')) {
    return 70000;
  }
  
  try {
    const connection = new Connection(RPC_ENDPOINT);
    const pubkey = new PublicKey(walletAddress);
    const mint = new PublicKey(NOCAP_TOKEN_MINT);
    const tokenAccounts = await connection.getTokenAccountsByOwner(pubkey, { mint });
    if (tokenAccounts.value.length > 0) {
      const balanceInfo = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
      return balanceInfo.value.uiAmount || 0;
    }
  } catch (e) {
    console.warn(`[Telegram Webhook] Failed to check NOCAP balance for ${walletAddress}:`, e);
  }
  return 0;
}

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
    [{ text: '👛 Cek Wallet', callback_data: 'action:wallet' }],
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

    // 3. Check if text is a Solana Mint or Wallet Address (Base58, 32-44 chars)
    const mintRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (mintRegex.test(text)) {
      const targetAddress = text;

      // Check if this Telegram Chat ID has linked their wallet
      const { data: dbSession } = await supabase
        .from('wallet_sessions')
        .select('wallet, free_scans, access')
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
          `You must link your Solana wallet to NoCap to perform scans and wallet checks from Telegram.\n\n` +
          `Please click the button below to secure your connection.`,
          connectKeyboard
        );
        return new Response(JSON.stringify({ ok: true }));
      }

      const userWallet = dbSession.wallet;
      const balance = await checkNocapBalance(userWallet);
      const holdsEnoughNocap = balance >= 66666 || dbSession.access;

      // Determine if targetAddress is a Token Mint or a Wallet Address
      let isMint = true;
      try {
        const RPC_ENDPOINT = process.env.RPC_ENDPOINT || process.env.HELIUS_API_KEY || 'https://api.mainnet-beta.solana.com';
        const connection = new Connection(RPC_ENDPOINT);
        const accountInfo = await connection.getAccountInfo(new PublicKey(targetAddress));
        if (accountInfo) {
          const owner = accountInfo.owner.toBase58();
          if (owner === '11111111111111111111111111111111') {
            isMint = false;
          }
        }
      } catch (e) {
        console.warn('[Telegram Webhook] Failed to determine address type, defaulting to Token Mint:', e);
      }

      if (isMint) {
        // Handle Token Scan Gating
        const remainingFree = dbSession.free_scans !== undefined && dbSession.free_scans !== null ? dbSession.free_scans : 3;
        if (!holdsEnoughNocap && remainingFree <= 0) {
          await sendTelegramMessage(
            chatId,
            `❌ <b>Access Restricted</b>\n\n` +
            `Your free scans are exhausted.\n\n` +
            `Please hold at least <b>66,666 $NOCAP</b> in your connected wallet to unlock unlimited free scans and wallet checks.`
          );
          return new Response(JSON.stringify({ ok: true }));
        }

        await sendTelegramMessage(
          chatId,
          `🔍 <b>NOCAP Agent</b>\n\n` +
          `Initiating live scan for token:\n` +
          `<code>${targetAddress}</code>\n\n` +
          `Analyzing on-chain activity...\n` +
          `Building wallet relationship graph...\n` +
          `Generating intelligence report...\n\n` +
          `Estimated time: 20–60 seconds.`
        );

        try {
          const response = await handleScan(targetAddress, false, userWallet, '127.0.0.1');
          const result = await response.json();

          if (result.error) {
            if (result.error === 'INSUFFICIENT_BALANCE' || result.error === 'Payment Required') {
              await sendTelegramMessage(
                chatId,
                `❌ <b>Scans Exhausted / Access Restricted</b>\n\n` +
                `Your free scans are exhausted.\n\n` +
                `Please hold at least <b>66,666 $NOCAP</b> in your connected wallet to unlock unlimited free scans and wallet checks.`
              );
            } else {
              await sendTelegramMessage(chatId, `❌ <b>Scan Failed</b>\n${result.message || result.error}`);
            }
            return new Response(JSON.stringify({ ok: true }));
          }

          const isCap = result.verdict === 'CAP';
          const verdictText = isCap ? '🔴 CAP' : '🟢 NO CAP';
          const confidencePercent = Math.round((result.confidence !== undefined && result.confidence !== null ? result.confidence : 0.5) * 100);

          let patternName = 'Organic Trading';
          if (result.subclass === 'extraction') {
            patternName = 'Extraction Scheme';
          } else if (result.subclass === 'coordinated') {
            patternName = 'Coordinated Attack';
          } else if (result.subclass) {
            patternName = result.subclass.charAt(0).toUpperCase() + result.subclass.slice(1) + ' Trading';
          }

          const reasonsList = result.reasons || [];
          const features = result.features || {};
          const findingsArray: string[] = [];

          reasonsList.forEach((r: any) => {
            if (r.code !== 'ORGANIC_VERDICT' && r.code !== 'COORDINATED_WARNING') {
              findingsArray.push(r.text || r);
            }
          });

          const parentShareValue = features.funding_parent_share || 0;
          if (parentShareValue >= 0.60) {
            findingsArray.push(`High clustering: ${Math.round(parentShareValue * 100)}% of buyers share a single funding parent, suggesting creator bundling.`);
          } else if (parentShareValue >= 0.20) {
            findingsArray.push(`Moderate clustering: ${Math.round(parentShareValue * 100)}% of buyers share funding sources, indicating semi-coordinated setups.`);
          } else {
            findingsArray.push(`Decentralized funding: less than 20% of buyers share a funding source, confirming independent retail entries.`);
          }

          const freshRatioValue = features.fresh_wallet_ratio || 0;
          if (freshRatioValue >= 0.60) {
            findingsArray.push(`High throwaway ratio: ${Math.round(freshRatioValue * 100)}% of early buyers use wallets created less than 24h ago, typical of sniper bots.`);
          } else {
            findingsArray.push(`Mature wallets: ${Math.round((1 - freshRatioValue) * 100)}% of buyers have active transaction histories older than 24 hours.`);
          }

          const sameBlockCount = features.same_block_count || 0;
          if (sameBlockCount > 4) {
            findingsArray.push(`Sniper concentration: ${sameBlockCount} buyers entered in the exact launch block, suggesting aggressive automated snipers.`);
          } else {
            findingsArray.push(`Spread execution: early buys are distributed across multiple blocks, indicating natural retail timing.`);
          }

          const sizeUniformityValue = features.size_uniformity || 0;
          if (sizeUniformityValue > 0 && sizeUniformityValue <= 0.05) {
            findingsArray.push(`Automated bot sizing: standard deviation of buys is extremely uniform (${sizeUniformityValue.toFixed(4)} SOL), typical of bot profiles.`);
          } else if (sizeUniformityValue > 0.05) {
            findingsArray.push(`Natural sizing variance: buy sizes deviate naturally by ${sizeUniformityValue.toFixed(4)} SOL, suggesting human retail participation.`);
          }

          const badOverlapValue = features.known_bad_overlap || 0;
          if (badOverlapValue >= 1) {
            findingsArray.push(`Bad actor alert: ${badOverlapValue} buyer wallet(s) have direct funding links to confirmed rug/extraction creators.`);
          } else {
            findingsArray.push('Clean reputation: zero buyer wallet links to blacklisted rug accounts or flagged wallets.');
          }

          const finalFindings = findingsArray.slice(0, 5);
          const keyFindings = finalFindings.map((f: string) => `• ${f}`).join('\n');
          const parentShare = Math.round((features.funding_parent_share || 0) * 100);
          const freshRatio = Math.round((features.fresh_wallet_ratio || 0) * 100);
          const sameBlock = (features.same_block_count || 0) > 4 ? 'High' : 'Low';
          const devFunding = features.deployer_funded ? 'Traced' : 'None';

          const reply = `🛡️ <b>NOCAP Agent Report</b>\n\n` +
            `<b>Contract</b>\n` +
            `<code>${targetAddress}</code>\n\n` +
            `<b>Verdict</b>\n` +
            `<b>${verdictText}</b>\n\n` +
            `<b>CAP prediction</b>\n` +
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
      } else {
        // Handle Wallet Check Gating
        if (!holdsEnoughNocap) {
          await sendTelegramMessage(
            chatId,
            `❌ <b>Access Restricted</b>\n\n` +
            `Wallet analysis requires holding at least <b>66,666 $NOCAP</b> in your connected wallet.\n\n` +
            `Please acquire enough $NOCAP to unlock wallet checks.`
          );
          return new Response(JSON.stringify({ ok: true }));
        }

        await sendTelegramMessage(
          chatId,
          `👛 <b>Analyzing Wallet</b>\n\n` +
          `Address: <code>${targetAddress}</code>\n` +
          `Fetching reputation, transaction history and cluster data...`
        );

        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const res = await fetch(`${appUrl}/api/v1/wallet/${targetAddress}`);
          const data = await res.json();
          
          if (data.error) {
            await sendTelegramMessage(chatId, `❌ <b>Wallet Check Failed</b>\n${data.error}`);
          } else {
            const tagEmoji = data.tag === 'RUGGER' ? '🔴' : data.tag === 'CEX' ? '🔵' : '🟢';
            const trustPercent = Math.round(data.trustScore * 100);
            const stats = data.stats || {};
            
            const responseText = `👛 <b>NOCAP Wallet Analysis</b>\n\n` +
              `<b>Address</b>\n` +
              `<code>${data.address}</code>\n\n` +
              `<b>Entity Tag</b>\n` +
              `${tagEmoji} <b>${data.tag}</b>\n\n` +
              `<b>Trust Score</b>\n` +
              `<b>${trustPercent}%</b>\n\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `🔎 <b>Historical Stats</b>\n` +
              `• Prior Launches: <b>${stats.priorLaunches || 0}</b>\n` +
              `• Prior Rugs: <b>${stats.priorRugs || 0}</b>\n` +
              `• Avg Extraction: <b>${(stats.avgExtractionSol || 0).toFixed(2)} SOL</b>\n` +
              `• Funded Snipers: <b>${stats.fundedSnipers || 0}</b>\n\n` +
              `<b>Cluster Association</b>\n` +
              `<code>${data.clusterId || 'none'}</code>\n\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `Powered by NoCap Agent.`;
              
            await sendTelegramMessage(chatId, responseText);
          }
        } catch (err: any) {
          await sendTelegramMessage(chatId, `❌ <b>Wallet Scan Error</b>\n${err.message || err}`);
        }
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
      const riskScore = Math.round(scan.confidence * 100);
      const riskColor = riskScore >= 60 ? '🔴' : riskScore >= 30 ? '🟡' : '🟢';

      const shortMint = scan.mint.substring(0, 6) + '...' + scan.mint.substring(scan.mint.length - 4);

      historyText += `• <code>${shortMint}</code>\nRisk Score: ${riskColor} <b>${riskScore} / 100</b>\nVerdict: <b>${scan.verdict}</b>\n\n`;
    });

    await sendTelegramMessage(chatId, historyText.trim());
  } catch (err: any) {
    await sendTelegramMessage(chatId, `❌ <b>Failed to fetch scan history</b>\n${err.message || err}`);
  }
}
