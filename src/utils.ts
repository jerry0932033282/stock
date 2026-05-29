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
 * Returns if a symbol is associated with the Taiwan stock market.
 */
export function isTaiwanAsset(symbol: string): boolean {
  if (!symbol) return false;
  const clean = symbol.trim();
  return clean.endsWith('.TW') || clean === 'T001.ACTIVE';
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
