import { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tgChatId, wallet } = body;

    if (!tgChatId || !wallet) {
      return new Response(JSON.stringify({ error: 'Missing tgChatId or wallet' }), { status: 400 });
    }

    // Update or insert session in Supabase
    const { data: dbSession } = await supabase
      .from('wallet_sessions')
      .select('*')
      .eq('wallet', wallet)
      .maybeSingle();

    if (dbSession) {
      await supabase.from('wallet_sessions').update({
        telegram_chat_id: tgChatId,
        connected: true,
        updated_at: new Date().toISOString(),
      }).eq('wallet', wallet);
    } else {
      await supabase.from('wallet_sessions').insert({
        wallet,
        telegram_chat_id: tgChatId,
        connected: true,
        access: false,
        access_until: 0,
        spins: 0,
        burns: 0,
        free_scans: 3,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Wallet linked successfully to Telegram.' }));
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
