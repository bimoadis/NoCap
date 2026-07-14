import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

if (!process.env.RPC_ENDPOINT) {
  dotenv.config();
  const workspaceEnv = path.resolve(process.cwd(), '.env');
  const parentEnv = path.resolve(process.cwd(), '../../.env');
  if (fs.existsSync(workspaceEnv)) {
    dotenv.config({ path: workspaceEnv });
  } else if (fs.existsSync(parentEnv)) {
    dotenv.config({ path: parentEnv });
  }
}

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || process.env.HELIUS_API_KEY || 'https://api.mainnet-beta.solana.com';

export async function GET() {
  try {
    const connection = new Connection(RPC_ENDPOINT);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    return NextResponse.json({ blockhash });
  } catch (err: any) {
    console.error('[Blockhash API] Failed to fetch latest blockhash:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch blockhash' }, { status: 500 });
  }
}
