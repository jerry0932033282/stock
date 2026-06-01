import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Import default structures to seed the initial real-time cache
import { TAIWAN_AI_STOCKS, US_AI_STOCKS, TAIWAN_ONLY_ETFS, GLOBAL_TECH_ETFS } from "./src/data.ts";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cache configuration
  interface QuoteData {
    symbol: string;
    closePrice: number;
    openPrice: number;
    change: number;
    changePercent: number;
    tradeVolume: number;
    currency: string;
    name: string;
    lastUpdated: string;
    error?: boolean;
    message?: string;
  }

  interface CacheEntry {
    data: QuoteData;
    timestamp: number;
  }

  const quoteCache = new Map<string, CacheEntry>();
  const CACHE_TTL = 3 * 60 * 1000; // 3-minute warm memory cache TTL

  // Helper to resolve Google Finance ticker & exchange
  function getGoogleFinanceTicker(symbol: string): string {
    const uSym = symbol.toUpperCase().trim();
    if (uSym.endsWith('.TW')) {
      return uSym.replace('.TW', '') + ':TPE';
    }
    if (uSym.includes(':')) {
      return uSym;
    }
    // If it starts with digits (e.g. "2330", "0050", "00981A"), it is a Taiwan asset
    if (/^\d+/.test(uSym)) {
      return uSym + ':TPE';
    }
    // Hardcoded NYSE vs NASDAQ for US assets
    const nyse = ['TSM', 'DELL', 'ANET', 'PLTR', 'CRM', 'ORCL'];
    if (nyse.includes(uSym)) {
      return `${uSym}:NYSE`;
    }
    return `${uSym}:NASDAQ`;
  }

  // Traverses Google GFinance nested callbacks to find matches
  interface QuoteCandidate {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    currency: string;
    name: string;
    isDetailed: boolean;
  }

  function findQuoteCandidates(arr: any, ticker: string, exchange: string, candidates: QuoteCandidate[] = []): QuoteCandidate[] {
    if (!arr || typeof arr !== 'object') return candidates;

    if (Array.isArray(arr)) {
      // 1. Detailed main quote format (ds:6 or ds:12 structure)
      if (arr.length > 15 && Array.isArray(arr[0]) && arr[0].length >= 2 && Array.isArray(arr[0][1])) {
        const symBlock = arr[0][1];
        if (symBlock[0] === ticker && symBlock[1] === exchange) {
          let change = 0;
          let changePercent = 0;
          const price = arr[2] || arr[15] || 0;
          if (Array.isArray(arr[19])) {
            if (Array.isArray(arr[19][5])) {
              change = arr[19][5][1] || 0;
              changePercent = arr[19][5][2] || 0;
            } else {
              for (const sub of arr[19]) {
                if (Array.isArray(sub) && sub.length >= 3 && typeof sub[0] === 'number' && typeof sub[1] === 'number' && typeof sub[2] === 'number') {
                  change = sub[1];
                  changePercent = sub[2];
                  break;
                }
              }
            }
          }
          candidates.push({
            price,
            change,
            changePercent,
            volume: arr[17] || 0,
            currency: arr[12] || '',
            name: arr[14] || '',
            isDetailed: true
          });
        }
      }

      // 2. Watchlist summary format
      if (arr.length >= 6 && Array.isArray(arr[1]) && arr[1][0] === ticker && arr[1][1] === exchange) {
        if (Array.isArray(arr[5])) {
          candidates.push({
            price: arr[5][0] || 0,
            change: arr[5][1] || 0,
            changePercent: arr[5][2] || 0,
            volume: arr[5].length > 6 ? arr[5][6] : 0,
            currency: arr[4] || '',
            name: arr[2] || '',
            isDetailed: false
          });
        }
      }

      for (const item of arr) {
        findQuoteCandidates(item, ticker, exchange, candidates);
      }
    } else {
      for (const key in arr) {
        if (Object.prototype.hasOwnProperty.call(arr, key)) {
          findQuoteCandidates(arr[key], ticker, exchange, candidates);
        }
      }
    }
    return candidates;
  }

  // Pure Google Finance Scraper
  async function fetchGoogleFinanceQuote(symbol: string): Promise<QuoteData | null> {
    const gSymbol = getGoogleFinanceTicker(symbol);
    const parts = gSymbol.split(':');
    const [ticker, exchange] = parts;
    const url = `https://www.google.com/finance/beta/quote/${gSymbol}`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7'
        }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const html = await res.text();

      const callbackRegex = /AF_initDataCallback\s*\(\s*\{\s*key:\s*'ds:\d+'[\s\S]*?data:\s*([\s\S]*?)\}\s*\)\s*;/g;
      let match;
      const candidates: QuoteCandidate[] = [];

      while ((match = callbackRegex.exec(html)) !== null) {
        let dataStr = match[1].trim();
        const sideChannelIdx = dataStr.indexOf(', sideChannel:');
        if (sideChannelIdx !== -1) {
          dataStr = dataStr.substring(0, sideChannelIdx).trim();
        }

        try {
          const evaluated = new Function(`return ${dataStr}`)();
          findQuoteCandidates(evaluated, ticker, exchange, candidates);
        } catch (err) {
          // ignore
        }
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (a.isDetailed && !b.isDetailed) return -1;
          if (!a.isDetailed && b.isDetailed) return 1;
          if (a.volume > 0 && b.volume === 0) return -1;
          if (a.volume === 0 && b.volume > 0) return 1;
          return b.price - a.price;
        });

        const selected = candidates[0];
        return {
          symbol: symbol,
          closePrice: selected.price,
          openPrice: selected.price,
          change: selected.change,
          changePercent: selected.changePercent,
          tradeVolume: selected.volume,
          currency: selected.currency,
          name: selected.name,
          lastUpdated: new Date().toISOString()
        };
      }
      throw new Error(`No mathing quote block for ${ticker}:${exchange}`);
    } catch (error: any) {
      console.error(`Google Finance Scraping Error for ${symbol} (${gSymbol}):`, error.message);
      return null;
    }
  }

  // Seeding cache function to pre-warm immediately from data.ts
  function seedCache() {
    console.log("Seeding in-memory stocks cache with default values...");
    for (const stock of TAIWAN_AI_STOCKS) {
      quoteCache.set(stock.id, {
        data: {
          symbol: stock.id,
          closePrice: stock.price,
          openPrice: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          tradeVolume: stock.volume * 1000, 
          currency: "TWD",
          name: stock.name,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now() - CACHE_TTL + 10000 // force reload after 10s on first load
      });
    }
    for (const stock of US_AI_STOCKS) {
      quoteCache.set(stock.id, {
        data: {
          symbol: stock.id,
          closePrice: stock.price,
          openPrice: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          tradeVolume: stock.volume, 
          currency: "USD",
          name: stock.name,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now() - CACHE_TTL + 10000
      });
    }
    for (const etf of TAIWAN_ONLY_ETFS) {
      quoteCache.set(etf.id, {
        data: {
          symbol: etf.id,
          closePrice: etf.price,
          openPrice: etf.price,
          change: etf.change,
          changePercent: etf.changePercent,
          tradeVolume: etf.volume * 1000,
          currency: "TWD",
          name: etf.name,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now() - CACHE_TTL + 10000
      });
    }
    for (const etf of GLOBAL_TECH_ETFS) {
      quoteCache.set(etf.id, {
        data: {
          symbol: etf.id,
          closePrice: etf.price,
          openPrice: etf.price,
          change: etf.change,
          changePercent: etf.changePercent,
          tradeVolume: etf.volume * 1000,
          currency: "TWD",
          name: etf.name,
          lastUpdated: new Date().toISOString()
        },
        timestamp: Date.now() - CACHE_TTL + 10000
      });
    }
    console.log(`Cache seeded successfully with ${quoteCache.size} items.`);
  }

  // Pre-seed cache
  seedCache();

  // Helper with caching & fallback resilience
  async function fetchSingleQuoteCached(symbol: string): Promise<QuoteData> {
    const now = Date.now();
    const cached = quoteCache.get(symbol);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }

    const scraped = await fetchGoogleFinanceQuote(symbol);
    if (scraped) {
      const entry = { data: scraped, timestamp: now };
      quoteCache.set(symbol, entry);
      return scraped;
    }

    if (cached) {
      // return stale data on lookup failure
      console.log(`Retrieving stale cached quote for failed request of ${symbol}`);
      return cached.data;
    }

    return {
      symbol,
      closePrice: 0,
      openPrice: 0,
      change: 0,
      changePercent: 0,
      tradeVolume: 0,
      currency: "",
      name: "",
      lastUpdated: new Date().toISOString(),
      error: true,
      message: "Scraping failed and no cached data available"
    };
  }

  // Limited Concurrency Batch Helper
  async function fetchInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(fn));
      results.push(...batchResults);
    }
    return results;
  }

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Universal GFinance Scraper endpoint (supports both /api/quotes and /api/fugle-quotes)
  const quotesHandler = async (req: any, res: any) => {
    const requestedSymbols = req.query.symbols as string;
    const symbolsList = requestedSymbols 
      ? Array.from(new Set(requestedSymbols.split(",").map((s: string) => s.trim()).filter(Boolean)))
      : [];

    if (symbolsList.length === 0) {
      const allData = Array.from(quoteCache.values()).map(e => e.data);
      return res.json({
        source: "google-finance-all-cached",
        data: allData
      });
    }

    try {
      console.log(`Handling batch quotes lookup for ${symbolsList.length} items...`);
      const results = await fetchInBatches(symbolsList, 15, s => fetchSingleQuoteCached(s));
      res.json({
        source: "google-finance-scraped",
        data: results
      });
    } catch (err: any) {
      res.status(500).json({ error: "Batch quote load failed", message: err?.message || err });
    }
  };

  app.get("/api/quotes", quotesHandler);
  app.get("/api/fugle-quotes", quotesHandler);

  // Vite middleware or Static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
