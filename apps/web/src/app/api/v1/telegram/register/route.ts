import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN is not configured.' }), { status: 500 });
  }

  const { searchParams } = request.nextUrl;
  const customUrl = searchParams.get('url');
  
  // Use Vercel host/origin or override via query param
  const origin = customUrl || request.nextUrl.origin;
  const webhookUrl = `${origin}/api/v1/telegram/webhook`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await res.json();
    return new Response(JSON.stringify({
      success: data.ok,
      message: data.description || 'Webhook configuration update attempted.',
      webhookUrl,
      raw: data,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
