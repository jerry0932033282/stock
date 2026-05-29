import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { RestClient } from "@fugle/marketdata";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Fugle RestClient
  const FUGLE_API_KEY = process.env.FUGLE_API_KEY || "ZjkyZmY1NmItNjFhOC00YmI4LWE0OTgtZjI2ZWQyZDZhZGMyIDI1OGFiYmNkLTcyNTQtNDgzMi1hMDQzLTk1N2M0N2U3MjMz==";
  const client = new RestClient({ apiKey: FUGLE_API_KEY });

  // In-Memory cache for individual stock/ETF quotes to avoid rate limiting on fallback
  interface CacheEntry {
    data: any;
    timestamp: number;
  }
  const quoteCache = new Map<string, CacheEntry>();
  const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

  // Helper to fetch individual symbol quote with caching
  async function fetchSingleQuoteCached(symbol: string) {
    const now = Date.now();
    const cached = quoteCache.get(symbol);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }

    try {
      const res = await client.stock.intraday.quote({ symbol });
      const mapped = {
        symbol: res.symbol,
        name: res.name,
        openPrice: res.openPrice,
        highPrice: res.highPrice,
        lowPrice: res.lowPrice,
        closePrice: res.closePrice,
        change: res.change,
        changePercent: res.changePercent,
        tradeVolume: res.total?.tradeVolume || 0,
        tradeValue: res.total?.tradeValue || 0,
        lastUpdated: res.lastUpdated
      };
      quoteCache.set(symbol, { data: mapped, timestamp: now });
      return mapped;
    } catch (error: any) {
      console.error(`Error fetching single quote for ${symbol}:`, error?.message || error);
      // Return stale device or default values on error
      if (cached) {
        return cached.data;
      }
      return {
        symbol,
        error: true,
        message: error?.message || "Failed to fetch"
      };
    }
  }

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API endpoint for Fugle Quotes
  app.get("/api/fugle-quotes", async (req, res) => {
    const requestedSymbols = req.query.symbols as string;
    const symbolsList = requestedSymbols 
      ? Array.from(new Set(requestedSymbols.split(",").map(s => s.trim()).filter(Boolean)))
      : [];

    // 1. Try snapshot first (Very fast, single api call if premium key)
    try {
      const response = await client.stock.snapshot.quotes({ market: "TSE" });
      if (response && response.data) {
        let filteredData = response.data;
        if (symbolsList.length > 0) {
          filteredData = response.data.filter((item: any) => symbolsList.includes(item.symbol));
        }
        return res.json({
          source: "snapshot",
          data: filteredData
        });
      }
    } catch (error: any) {
      console.log("Snapshot call failed or is forbidden, falling back to batch intraday query...", error?.message || error);
    }

    // 2. Fallback: Batch intraday query for requested symbols
    if (symbolsList.length === 0) {
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "Snapshot is forbidden on this API Key, and no specific symbols were requested." 
      });
    }

    try {
      const results = await Promise.all(symbolsList.map(s => fetchSingleQuoteCached(s)));
      res.json({
        source: "intraday-batch",
        data: results
      });
    } catch (err: any) {
      res.status(500).json({ error: "Batch fetch failed", message: err?.message || err });
    }
  });

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
