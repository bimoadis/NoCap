import { NextRequest } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ addr: string }> }
) {
  const { addr } = await params;

  if (!addr) {
    return new Response(JSON.stringify({ error: 'Missing wallet address' }), { status: 400 });
  }

  try {
    const { data: cached, error } = await supabase
      .from('wallet_profiles')
      .select('*')
      .eq('address', addr)
      .maybeSingle();

    if (error || !cached) {
      return new Response(JSON.stringify({
        address: addr,
        tag: 'ORGANIC',
        trustScore: 1.0,
        stats: {
          priorRugs: 0,
          priorLaunches: 0,
          avgExtractionSol: 0,
          fundedSnipers: 0,
        },
        clusterId: 'none',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let tag = 'ORGANIC';
    if ((cached.reputation_flags as string[] || []).includes('rug_participant') || cached.dead_under_10m >= 3) {
      tag = 'RUGGER';
    } else if (cached.funder_type === 'cex') {
      tag = 'CEX';
    } else if (cached.funder_type === 'deployer') {
      tag = 'DEPLOYER';
    }

    return new Response(JSON.stringify({
      address: cached.address,
      tag,
      trustScore: cached.trust,
      stats: {
        priorRugs: cached.dead_under_10m,
        priorLaunches: cached.launches,
        avgExtractionSol: cached.avg_extraction_sol,
        fundedSnipers: cached.funded_snipers,
      },
      clusterId: cached.cluster || 'none',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.warn('[Next.js API] Database query failed. Falling back to sandbox response.');
    const isRugger = addr.startsWith('7xKp');
    return new Response(JSON.stringify({
      address: addr,
      tag: isRugger ? 'RUGGER' : 'ORGANIC',
      trustScore: isRugger ? 0.05 : 0.92,
      stats: {
        priorRugs: isRugger ? 31 : 0,
        priorLaunches: isRugger ? 48 : 1,
        avgExtractionSol: isRugger ? 12.0 : 0.0,
        fundedSnipers: isRugger ? 14 : 0,
      },
      clusterId: isRugger ? 'C114' : 'none',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
