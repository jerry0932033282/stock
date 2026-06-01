/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resolves a ticker symbol to the correct Google Finance URL quote page format.
 * - Taiwan symbols (e.g., "2330.TW", "0050.TW") map to :TPE (Taipei Exchange).
 * - Active mutual funds provide fallbacks to TPE indexing.
 * - Major US listings map to :NASDAQ or :NYSE depending on the ticker.
 */
export function getGoogleFinanceUrl(symbol: string): string {
  if (!symbol) return 'https://www.google.com/finance';

  const cleanSymbol = symbol.trim();

  // If symbol contains colon directly (e.g. 00981A:TPE)
  if (cleanSymbol.includes(':')) {
    return `https://www.google.com/finance/beta/quote/${cleanSymbol}`;
  }

  // If it's a Taiwan symbol ending in .TW
  if (cleanSymbol.endsWith('.TW')) {
    const ticker = cleanSymbol.replace('.TW', '');
    return `https://www.google.com/finance/beta/quote/${ticker}:TPE`;
  }

  // Handle active mutual funds
  if (cleanSymbol === 'T001.ACTIVE') {
    // Active fund: Map to Taipei Main Index or generic finance page for Taiwan
    return 'https://www.google.com/finance/beta/quote/TAIEX:INDEX';
  }
  if (cleanSymbol === 'G001.ACTIVE') {
    // Global Active: Map to S&P 500
    return 'https://www.google.com/finance/beta/quote/.INX:INDEX';
  }

  // Handle specific US Stock Exchanges
  // NYSE Listings
  const nyseStocks = ['TSM', 'DELL', 'ANET', 'PLTR'];
  if (nyseStocks.includes(cleanSymbol)) {
    return `https://www.google.com/finance/beta/quote/${cleanSymbol}:NYSE`;
  }

  // Default to NASDAQ for US tech stocks
  return `https://www.google.com/finance/beta/quote/${cleanSymbol}:NASDAQ`;
}

/**
 * Resolves a beneficiary tag (e.g., "2330 台積電", "TSM", "00735") to its Google Finance URL.
 */
export function getBeneficiaryUrl(beneficiary: string): string {
  if (!beneficiary) return 'https://www.google.com/finance';
  
  const clean = beneficiary.trim();
  
  // 1. Is there a 4-digit or more Taiwan STOCK symbol inside?
  const idMatch = clean.match(/\b\d{4,5}[A-Za-z]?\b/);
  if (idMatch) {
    const code = idMatch[0];
    // If it's 00981A or 00988A (active mutual funds/index listed on TPE)
    if (code === '00981A' || code === '00988A') {
      return getGoogleFinanceUrl(`${code}:TPE`);
    }
    // General Taiwan stock/ETF
    return getGoogleFinanceUrl(`${code}.TW`);
  }

  // 2. Exact match check (Taiwan Active ETFs and other known variations)
  if (clean.includes('00735')) return getGoogleFinanceUrl('00735.TW');
  if (clean.includes('00981A')) return getGoogleFinanceUrl('00981A:TPE');
  if (clean.includes('00988A')) return getGoogleFinanceUrl('00988A:TPE');
  if (clean === '聯發科') return getGoogleFinanceUrl('2454.TW');
  if (clean === '台積電') return getGoogleFinanceUrl('2330.TW');
  if (clean === '奇鋐') return getGoogleFinanceUrl('3017.TW');
  if (clean === '雙鴻') return getGoogleFinanceUrl('3324.TW');

  // 3. For US stocks or standard ticker symbols, clean and get target URL
  // Matches pure letters like "TSM", "NVDA", "PLTR", etc.
  const usTickerMatch = clean.match(/^[A-Za-z]+/);
  if (usTickerMatch) {
    return getGoogleFinanceUrl(usTickerMatch[0]);
  }

  // Fallback: search query on Google Finance
  return `https://www.google.com/finance/beta/quote/${encodeURIComponent(clean)}`;
}

/**
 * Resolves any company holding name (such as "台積電 (台)", "NVIDIA (美)", "ASML") to a Google Finance search.
 */
export function getHoldingUrl(holdingName: string): string {
  if (!holdingName) return 'https://www.google.com/finance';
  
  const clean = holdingName.replace(/\(.*?\)/g, '').trim(); // Remove parentheses like (美), (台)
  return `https://www.google.com/search?q=${encodeURIComponent(clean)}+stock+price`;
}

/**
 * Resolves a company sector tag to a Google Search query
 */
export function getSectorSearchUrl(sector: string): string {
  if (!sector) return 'https://www.google.com/finance';
  const cleanSector = sector.replace(/\(.*?\)/g, '').trim();
  return `https://www.google.com/search?q=${encodeURIComponent(cleanSector)}+%E8%82%B1%E5%B8%82`;
}

/**
 * Returns if a symbol is associated with the Taiwan stock market.
 */
export function isTaiwanAsset(symbol: string): boolean {
  if (!symbol) return false;
  const clean = symbol.trim().toUpperCase();
  return clean.endsWith('.TW') || clean.includes(':TPE') || clean === 'T001.ACTIVE' || /^\d+/.test(clean);
}

/**
 * Returns the correct Tailwind text color class for trend based on regional conventions.
 * In Taiwan: rising is red/rose, falling is green/emerald.
 * In US: rising is green/emerald, falling is red/rose.
 */
export function getTrendTextColor(change: number, symbol: string): string {
  const isTW = isTaiwanAsset(symbol);
  if (isTW) {
    return change >= 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600 font-extrabold';
  } else {
    return change >= 0 ? 'text-emerald-600 font-extrabold' : 'text-red-600 font-extrabold';
  }
}

/**
 * Returns the correct Tailwind bg/badge color class for trend.
 * In Taiwan: rising is light red, falling is light green.
 * In US: rising is light green, falling is light red.
 */
export function getTrendBgColor(change: number, symbol: string): string {
  const isTW = isTaiwanAsset(symbol);
  if (isTW) {
    return change >= 0 
      ? 'bg-red-50 text-red-700 border-red-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-250';
  } else {
    return change >= 0 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-red-50 text-red-700 border-red-250';
  }
}

/**
 * Formats a stock/ETF volume according to Google Finance standards.
 * - Taiwan: volume parameter is in "張" (lots). Convert to "股" (shares) by multiplying by 1000,
 *           then format to "萬" or "億". For example: TSMC volume of 89561.9 lots -> 89561900 shares -> 8,956.19萬.
 * - US/Global: volume parameter is in "股" (shares). Format with "M" or "K".
 */
export function formatVolume(volume: number, symbol: string): string {
  const isTW = isTaiwanAsset(symbol);
  
  if (isTW) {
    const shares = volume * 1000;
    if (shares >= 100000000) {
      return `${(shares / 100000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}億`;
    } else {
      return `${(shares / 10000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}萬`;
    }
  } else {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`;
    } else {
      return `${volume.toLocaleString()}`;
    }
  }
}
