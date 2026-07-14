// Official Stock Tokens list (symbol -> contract)
export const OFFICIAL_STOCK_TOKENS: Record<string, string> = {
  NVDA: '0xabcde123456789012345678901234567890abcde',
  AAPL: '0x12345abcde12345abcde12345abcde12345abcde',
  GOOG: '0x9999999999999999999999999999999999999999'
};

export function checkStockTokenImpersonation(symbol: string, contractAddress: string): {
  isImpersonator: boolean;
  targetRealAsset?: string;
} {
  const normalizedSymbol = symbol.toUpperCase().trim();
  const isOfficialName = normalizedSymbol in OFFICIAL_STOCK_TOKENS;

  if (isOfficialName) {
    const realAddress = OFFICIAL_STOCK_TOKENS[normalizedSymbol];
    if (contractAddress.toLowerCase() !== realAddress.toLowerCase()) {
      // Ticker matches official stock, but contract address is fake! Impersonation detected!
      return {
        isImpersonator: true,
        targetRealAsset: realAddress
      };
    }
  }

  // Check fuzzy lookalike (e.g. NVDIA, AAPLL)
  for (const stockSymbol of Object.keys(OFFICIAL_STOCK_TOKENS)) {
    if (stockSymbol !== normalizedSymbol && levenshteinDistance(stockSymbol, normalizedSymbol) <= 1) {
      return {
        isImpersonator: true,
        targetRealAsset: OFFICIAL_STOCK_TOKENS[stockSymbol]
      };
    }
  }

  return { isImpersonator: false };
}

function levenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}
