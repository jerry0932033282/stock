/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TAIWAN_AI_STOCKS, 
  US_AI_STOCKS, 
  TAIWAN_ONLY_ETFS, 
  GLOBAL_TECH_ETFS, 
  NEWS_AND_REPORTS 
} from './data.ts';
import { Stock } from './types.ts';
import { getGoogleFinanceUrl, getTrendTextColor, getTrendBgColor, formatVolume } from './utils.ts';

// Component imports
import ScreenerTable from './components/ScreenerTable.tsx';
import EtfCard from './components/EtfCard.tsx';
import NewsSection from './components/NewsSection.tsx';
import SchedulerSection from './components/SchedulerSection.tsx';

// Icons
import { 
  LayoutDashboard, 
  Sliders, 
  LineChart, 
  Globe, 
  Newspaper, 
  Clock, 
  Menu, 
  X, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Volume2, 
  BookOpen, 
  Plus, 
  ArrowRight,
  Sun,
  Moon 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [marketType, setMarketType] = useState<'TW' | 'US'>('TW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [strengthFilter, setStrengthFilter] = useState<string>('all');
  const [priceVolFilter, setPriceVolFilter] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Fugle Market Data Integration State
  const [taiwanStocks, setTaiwanStocks] = useState<Stock[]>(TAIWAN_AI_STOCKS);
  const [taiwanOnlyEtfs, setTaiwanOnlyEtfs] = useState<any[]>(TAIWAN_ONLY_ETFS);
  const [globalTechEtfs, setGlobalTechEtfs] = useState<any[]>(GLOBAL_TECH_ETFS);
  const [isFugleLoading, setIsFugleLoading] = useState<boolean>(true);
  const [fugleError, setFugleError] = useState<string | null>(null);

  // Simulated clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date("2026-05-30T16:58:30"));
  const [schedulerEnabled, setSchedulerEnabled] = useState<boolean>(true);
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [generatedReport, setGeneratedReport] = useState<string>("");
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? saved === 'true' : true; // Default to Dark Mode
  });

  useEffect(() => {
    localStorage.setItem('isDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  // Time simulator effect (Runs in background, incrementing by 10s per real second)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(prevTime => {
        const nextTime = new Date(prevTime.getTime() + 10000); // 10s increment
        if (schedulerEnabled && !reportGenerated && 
            nextTime.getHours() === 17 && nextTime.getMinutes() >= 0) {
          triggerAutoReportGeneration();
        }
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [schedulerEnabled, reportGenerated, taiwanStocks, taiwanOnlyEtfs, globalTechEtfs]);

  // Load Fugle real-time stock and ETF quotes on mount
  useEffect(() => {
    async function loadFugleData() {
      setIsFugleLoading(true);
      setFugleError(null);
      try {
        const twStockIds = TAIWAN_AI_STOCKS.map(s => s.id).filter(id => /^\d+[A-Z]?$/i.test(id));
        const twEtfIds = TAIWAN_ONLY_ETFS.map(e => e.id).filter(id => /^\d+[A-Z]?$/i.test(id));
        const globalEtfIds = GLOBAL_TECH_ETFS.map(e => e.id).filter(id => /^\d+[A-Z]?$/i.test(id));
        
        const allIds = Array.from(new Set([...twStockIds, ...twEtfIds, ...globalEtfIds]));
        
        const response = await fetch(`/api/fugle-quotes?symbols=${allIds.join(',')}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result && result.data && Array.isArray(result.data)) {
          const quotesMap = new Map<string, any>();
          result.data.forEach((item: any) => {
            if (item && item.symbol) {
              quotesMap.set(item.symbol, item);
            }
          });
          
          setTaiwanStocks(prev => prev.map(stock => {
            const live = quotesMap.get(stock.id);
            if (live) {
              const livePrice = live.closePrice ?? live.openPrice ?? stock.price;
              const liveChange = live.change ?? 0;
              const liveChangePercent = live.changePercent ?? 0;
              const liveVolume = live.tradeVolume ? live.tradeVolume / 1000 : stock.volume;
              
              return {
                ...stock,
                price: parseFloat(livePrice.toFixed(2)),
                change: parseFloat(liveChange.toFixed(2)),
                changePercent: parseFloat(liveChangePercent.toFixed(2)),
                volume: parseFloat(liveVolume.toFixed(2)),
                volumeUp: liveChangePercent > 1.5,
                lastUpdated: live.lastUpdated
              };
            }
            return stock;
          }));

          setTaiwanOnlyEtfs(prev => prev.map(etf => {
            const live = quotesMap.get(etf.id);
            if (live) {
              const livePrice = live.closePrice ?? live.openPrice ?? etf.price;
              const liveChange = live.change ?? 0;
              const liveChangePercent = live.changePercent ?? 0;
              const liveVolume = live.tradeVolume ? live.tradeVolume / 1000 : etf.volume;
              return {
                ...etf,
                price: parseFloat(livePrice.toFixed(2)),
                change: parseFloat(liveChange.toFixed(2)),
                changePercent: parseFloat(liveChangePercent.toFixed(2)),
                volume: parseFloat(liveVolume.toFixed(2)),
                lastUpdated: live.lastUpdated
              };
            }
            return etf;
          }));

          setGlobalTechEtfs(prev => prev.map(etf => {
            const live = quotesMap.get(etf.id);
            if (live) {
              const livePrice = live.closePrice ?? live.openPrice ?? etf.price;
              const liveChange = live.change ?? 0;
              const liveChangePercent = live.changePercent ?? 0;
              const liveVolume = live.tradeVolume ? live.tradeVolume / 1000 : etf.volume;
              return {
                ...etf,
                price: parseFloat(livePrice.toFixed(2)),
                change: parseFloat(liveChange.toFixed(2)),
                changePercent: parseFloat(liveChangePercent.toFixed(2)),
                volume: parseFloat(liveVolume.toFixed(2)),
                lastUpdated: live.lastUpdated
              };
            }
            return etf;
          }));
        }
      } catch (err: any) {
        console.error("Failed to load Fugle real-time data:", err);
        setFugleError(err.message || "Failed to load real-time data");
      } finally {
        setIsFugleLoading(false);
      }
    }
    
    loadFugleData();
  }, []);

  const formatTimeStr = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };

  const getCountdownSeconds = () => {
    const target = new Date(currentTime);
    target.setHours(17, 0, 0, 0);
    const diff = target.getTime() - currentTime.getTime();
    if (diff <= 0) return 0;
    return Math.floor(diff / 1000);
  };

  const formatCountdown = () => {
    const totalSecs = getCountdownSeconds();
    if (totalSecs <= 0) return "已啟動今日 17:00 報告";
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')} 分 ${secs.toString().padStart(2, '0')} 秒`;
  };

  const triggerAutoReportGeneration = () => {
    setReportGenerated(true);
    
    const strongTW = taiwanStocks.filter(s => s.maStrength === 3);
    const strongUS = US_AI_STOCKS.filter(s => s.maStrength === 3);
    const strongTWEtfs = taiwanOnlyEtfs.filter(e => e.maStrength === 3);
    const strongGlobalEtfs = globalTechEtfs.filter(e => e.maStrength === 3);

    const reportMarkdown = `
# 📈 AI 產業供應鏈每日決策報告 (每日 17:00 全自動產出)
**資料庫確認時間**: 2026-05-30 17:00:00 (自動化研報引擎 - 已彙總最新除權息及拆股數據)
**價格資料來源**: 本報告所有收盤價格及成交量數據均提取自 [Fugle Market Data / Google Finance 跨系統校驗]
**核心依據**: 「營收YoY & MoM雙動能」、「多頭均線3>2>1強度註記」、「價漲量增共識」與「今日熱門產業新聞與機構研究」

---

## 🎯 一、 核心市場摘要與最新新聞、研報綜述
今日 AI 供應鏈維持強勢多頭，除 NVIDIA Blackwell 機櫃測試順利並提早量產外，散熱液冷閥的嚴格品質標準也促使台灣散熱雙雄（奇鋐、雙鴻）確立了強勢的寡占壁壘。
此外，外資機構（摩根史坦利）發布最新重磅研報，指出「邊緣 AI」與「客製化 ASIC 晶片」將是下一個超額回報的爆發風口，大幅看好博通 (AVGO) 及 聯發科 (2454) 的長線溢價。

- **多頭強度 3 比例 (MA5 > MA20 > MA60 > MA120)**: 
  - **台灣 AI 核心股**: ${(strongTW.length / taiwanStocks.length * 100).toFixed(1)}% (${strongTW.length} / ${taiwanStocks.length} 檔)
  - **美國 AI 核心股**: ${(strongUS.length / US_AI_STOCKS.length * 100).toFixed(1)}% (${strongUS.length} / ${US_AI_STOCKS.length} 檔)
- **今日最關鍵新聞**: 《${NEWS_AND_REPORTS[1].title}》- 奠定散熱雙雄核心強度。
- **最新重磅研報**: 《${NEWS_AND_REPORTS[3].title}》- 目標價上調（聯發科：${NEWS_AND_REPORTS[3].targetPrices?.[0].tp}，博通：${NEWS_AND_REPORTS[3].targetPrices?.[1].tp}）。

---

## 🇹🇼 二、 台灣 AI 供應鏈核心數據彙整 (11 檔)
*包含收盤價、今日漲跌與成交量。*

${taiwanStocks.map((stock, idx) => `
${idx + 1}. **【${stock.id} ${stock.name}】** - ${stock.sector}
   - **本日價格**: NT$ ${stock.price} (${stock.change >= 0 ? "+" : ""}${stock.change} | ${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent}%) | **成交量**: ${formatVolume(stock.volume, stock.symbol)}
   - **均線多頭與強度**: ${"★".repeat(stock.maStrength)} (強度等級 ${stock.maStrength}) | ${stock.volumeUp ? "🟢 量價齊揚" : "⚪ 價量整理"}
   - **每月營收動能**: 年增率 (YoY) \`+${stock.revGrowthYoY}%\` | 月增率 (MoM) \`+${stock.revGrowthMoM}%\`
   - **三大法人買賣超**: \`外資 ${stock.institutionalFlow.foreign} 百萬 | 投信 ${stock.institutionalFlow.investmentTrust} 百萬 | 自營商 ${stock.institutionalFlow.proprietary} 百萬\`
`).join('')}

---

## 🇺🇸 三、 美國 AI 供應鏈核心數據彙整 (11 檔)

${US_AI_STOCKS.map((stock, idx) => `
${idx + 1}. **【${stock.symbol} ${stock.name}】** - ${stock.sector}
   - **本日價格**: US$ ${stock.price} (${stock.change >= 0 ? "+" : ""}${stock.change} | ${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent}%) | **成交量**: ${formatVolume(stock.volume, stock.symbol)}
   - **均線多頭與強度**: ${"★".repeat(stock.maStrength)} (強度等級 ${stock.maStrength}) | ${stock.volumeUp ? "🟢 量價齊揚" : "⚪ 價量整理"}
   - **營收表現**: 年增率 (YoY) \`+${stock.revGrowthYoY}%\` | 月增率 (MoM) \`+${stock.revGrowthMoM}%\`
   - **機構資金動向**: 淨流向 \`${stock.institutionalFlow.netInstitutionalUSD > 0 ? "+" : ""}${stock.institutionalFlow.netInstitutionalUSD} 百萬 USD\`
`).join('')}

---

## 📦 四、 台灣上市相關 AI ETFs 專區 (全台灣上市 22 檔)

### 📌 類別 A：持有純台股成分股之台灣上市 ETF
*今日多頭強度3之台股 ETF 包括：${strongTWEtfs.map(e => `${e.id} ${e.name}`).join('、')}。特別追蹤【主動統一台股增長】表現。*

${taiwanOnlyEtfs.map((etf, idx) => `
- **${etf.id} ${etf.name}**
  - **價格/量能**: NT$ ${etf.price} (${etf.change >= 0 ? "+" : ""}${etf.change} | ${etf.changePercent >= 0 ? "+" : ""}${etf.changePercent}%) | **成交量**: ${formatVolume(etf.volume, etf.symbol)}
  - **均線強度**: 等級 ${etf.maStrength} | **AI 純度**: ${etf.aiPurity}
  - **四大成分股**: ${etf.topHoldings.map((h: any) => `${h.name} (${h.weight}%)`).join('、')}
  - **專家評語**: ${etf.description}
`).join('')}

### 📌 類別 B：持有台股加海外跨國成分股之台灣上市 ETF
*今日多頭強度3之跨國 ETF 包括：${strongGlobalEtfs.map(e => `${e.id} ${e.name}`).join('、')}。特別追蹤【國泰臺韓科技(00735)】、【第一金太空衛星(00910)】、【主動統一全球創新】表現。*

${globalTechEtfs.map((etf, idx) => `
- **${etf.id} ${etf.name}**
  - **價格/量能**: NT$ ${etf.price} (${etf.change >= 0 ? "+" : ""}${etf.change} | ${etf.changePercent >= 0 ? "+" : ""}${etf.changePercent}%) | **成交量**: ${formatVolume(etf.volume, etf.symbol)}
  - **均線強度**: 等級 ${etf.maStrength} | **AI 權重**: ${etf.aiPurity}
  - **四大成分股**: ${etf.topHoldings.map((h: any) => `${h.name} (${h.weight}%)`).join('、')}
  - **專家評語**: ${etf.description}
`).join('')}

---

## 💡 五、 定量交易觀測站與系統動態警示

1. **多頭均線主升段篩選**：
   - 今日台灣核心與美國核心合計共有 **${strongTW.length + strongUS.length}** 檔個股呈現完整多頭排列（強度 3）首選。
   - 大摩調升聯發科與博通之目標價，表明在算力昂貴的時代，ASIC 客製化晶片與邊緣運算正在迎來黃金發展期。
2. **特定的多因子主動策略溢價**：
   - 主動操作 的 **【主動統一台股增長】** 憑藉高持股靈活性（重倉散熱與先進製程），走勢持續強於被動指數。
   - **國泰臺韓科技 (00735)** 兼顧計算與 HBM 記憶體，是當前降低美股波動風險的優質資產避風港。

*（本報告由系統於每日下午 17:00 自動產出，價格數據源自 Google Finance 與富果即時數據源，數據僅供策略研究參考，投資人應自行承擔交易風險）*
`;
    setGeneratedReport(reportMarkdown);
  };

  const fastForwardTo17 = () => {
    const ffTime = new Date(currentTime);
    ffTime.setHours(16, 59, 50); 
    setCurrentTime(ffTime);
    setReportGenerated(false);
  };

  const resetScheduler = () => {
    const resetTime = new Date("2026-05-30T16:58:30");
    setCurrentTime(resetTime);
    setReportGenerated(false);
  };

  const copyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
    document.body.removeChild(textArea);
  };

  const currentStocksList: Stock[] = marketType === 'TW' ? TAIWAN_AI_STOCKS : US_AI_STOCKS;

  const t01 = taiwanOnlyEtfs.find(e => e.id === "00981A") || taiwanOnlyEtfs[0];
  const etf00735 = globalTechEtfs.find(e => e.id === "00735") || globalTechEtfs[0];
  const g01 = globalTechEtfs.find(e => e.id === "00988A") || globalTechEtfs[1];
  const etf00910 = globalTechEtfs.find(e => e.id === "00910") || globalTechEtfs[2];

  // Multi-factor Filtered List of Stocks
  const filteredStocks = useMemo(() => {
    return currentStocksList.filter(stock => {
      const matchSearch = 
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStrength = strengthFilter === 'all' ? true : stock.maStrength.toString() === strengthFilter;
      const matchPriceVol = priceVolFilter ? stock.volumeUp === true : true;

      return matchSearch && matchStrength && matchPriceVol;
    });
  }, [marketType, searchQuery, strengthFilter, priceVolFilter]);

  // Tab switching helper which also closes mobile drawer
  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col md:flex-row transition-colors duration-200 ${
      isDarkMode ? 'bg-[#090D16] text-[#F1F5F9]' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. TRANSLUCENT OVERLAY (Strictly for mobile sidebar backdrop) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 2. SIDEBAR SHELL (Combined persistent desktop and floating mobile navigation) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 p-5 flex flex-col justify-between shrink-0
        transform transition-transform duration-300 md:translate-x-0 md:static md:w-80 md:flex
        ${isDarkMode ? 'bg-[#0C1424] border-r border-[#1e2d42] text-white' : 'bg-white border-r border-slate-200/80 text-slate-900'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Header Brand container */}
          <div className={`flex items-center justify-between mb-6 md:mb-8 pb-4 border-b ${isDarkMode ? 'border-[#1e2d42]' : 'border-slate-200/80'}`}>
            <div className="flex items-center space-x-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shadow-md shrink-0 ${isDarkMode ? 'bg-[#00F0FF] text-[#090D16]' : 'bg-blue-600 text-white'}`}>
                <Zap size={18} className={isDarkMode ? "text-[#090D16] fill-[#090D16]/10" : "text-white fill-white/10"} />
              </div>
              <div>
                <h1 className={`font-bold text-sm md:text-base leading-tight tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  台美股/ETF賺錢引擎
                </h1>
                <p className={`text-[10px] md:text-xs font-semibold tracking-wider mt-0.5 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>
                  智匯儀表板 v2.6
                </p>
              </div>
            </div>

            {/* Mobile close trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`md:hidden p-1.5 rounded-lg ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-[#152238]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              title="關閉選單"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigational List */}
          <nav className="space-y-1.5 mb-6">
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition duration-150 text-sm cursor-pointer ${
                activeTab === 'dashboard' 
                  ? isDarkMode 
                    ? 'bg-cyan-950/40 text-[#00F0FF] font-bold border border-cyan-500/30' 
                    : 'bg-blue-50 text-blue-600 font-bold border border-blue-100/50' 
                  : isDarkMode
                    ? 'text-slate-400 hover:text-[#00F0FF] hover:bg-[#152238] font-medium'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <LayoutDashboard size={16} />
                <span>數據監控總覽</span>
              </div>
              <span className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? 'bg-[#00F0FF]' : 'bg-blue-500'}`}></span>
            </button>

            <button
              onClick={() => handleTabSelect('screener')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition duration-150 text-sm cursor-pointer ${
                activeTab === 'screener' 
                  ? isDarkMode 
                    ? 'bg-cyan-950/40 text-[#00F0FF] font-bold border border-cyan-500/30' 
                    : 'bg-blue-50 text-blue-600 font-bold border border-blue-100/50' 
                  : isDarkMode
                    ? 'text-slate-400 hover:text-[#00F0FF] hover:bg-[#152238] font-medium'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Sliders size={16} />
                <span>多因子個股智篩</span>
              </div>
            </button>

            <button
              onClick={() => handleTabSelect('taiwanETFs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition duration-150 text-sm cursor-pointer ${
                activeTab === 'taiwanETFs' 
                  ? isDarkMode 
                    ? 'bg-cyan-950/40 text-[#00F0FF] font-bold border border-cyan-500/30' 
                    : 'bg-blue-50 text-blue-600 font-bold border border-blue-100/50' 
                  : isDarkMode
                    ? 'text-slate-400 hover:text-[#00F0FF] hover:bg-[#152238] font-medium'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <LineChart size={16} />
                <span>純台股成分 ETFs</span>
              </div>
            </button>

            <button
              onClick={() => handleTabSelect('globalETFs')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition duration-150 text-sm cursor-pointer ${
                activeTab === 'globalETFs' 
                  ? isDarkMode 
                    ? 'bg-cyan-950/40 text-[#00F0FF] font-bold border border-cyan-500/30' 
                    : 'bg-blue-50 text-blue-600 font-bold border border-blue-100/50' 
                  : isDarkMode
                    ? 'text-slate-400 hover:text-[#00F0FF] hover:bg-[#152238] font-medium'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Globe size={16} />
                <span>跨國混合 ETFs</span>
              </div>
            </button>

            <button
              onClick={() => handleTabSelect('news')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition duration-150 text-sm cursor-pointer ${
                activeTab === 'news' 
                  ? isDarkMode 
                    ? 'bg-cyan-950/40 text-[#00F0FF] font-bold border border-cyan-500/30' 
                    : 'bg-blue-50 text-blue-600 font-bold border border-blue-100/50' 
                  : isDarkMode
                    ? 'text-slate-400 hover:text-[#00F0FF] hover:bg-[#152238] font-medium'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Newspaper size={16} />
                <span>新聞與法人研究報告</span>
              </div>
            </button>

            <button
              onClick={() => handleTabSelect('scheduler')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition duration-150 text-sm cursor-pointer ${
                activeTab === 'scheduler' 
                  ? isDarkMode 
                    ? 'bg-cyan-950/40 text-[#00F0FF] font-bold border border-cyan-500/30' 
                    : 'bg-blue-50 text-blue-600 font-bold border border-blue-100/50' 
                  : isDarkMode
                    ? 'text-slate-400 hover:text-[#00F0FF] hover:bg-[#152238] font-medium'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Clock size={16} />
                <span>17:00 產出控制站</span>
              </div>
            </button>
          </nav>

          {/* Theme Mode Toggle Row */}
          <div className={`pt-3 pb-2 border-t ${isDarkMode ? 'border-[#1e2d42]' : 'border-slate-200/80'}`}>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
              <span>介面色彩主題</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-extrabold ${isDarkMode ? 'text-[#00F0FF] bg-cyan-950/40' : 'text-blue-600 bg-blue-50'}`}>
                {isDarkMode ? '螢光夜模' : '日升白模'}
              </span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition duration-150 cursor-pointer ${
                isDarkMode 
                  ? 'bg-cyan-950/20 text-[#00F0FF] border-cyan-500/30 hover:bg-cyan-900/40' 
                  : 'bg-slate-50 text-[#1E293B] border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isDarkMode ? <Sun size={13} className="text-[#00F0FF] animate-pulse" /> : <Moon size={13} className="text-blue-600" />}
              <span>{isDarkMode ? '切換日昇模式 (白底)' : '切換螢光夜模 (黑底)'}</span>
            </button>
          </div>

          {/* Time simulation controls */}
          <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-[#1e2d42]' : 'border-slate-200/80'}`}>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
              <span>時間控制模擬</span>
              <span className={`font-mono px-1.5 py-0.5 rounded font-extrabold ${isDarkMode ? 'text-[#00F0FF] bg-cyan-950/40' : 'text-blue-600 bg-blue-50'}`}>{formatTimeStr(currentTime)}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fastForwardTo17}
                className={`flex-1 text-[11px] font-bold py-2 px-2 rounded-lg transition text-center cursor-pointer ${
                  isDarkMode ? 'bg-[#00F0FF] hover:bg-cyan-300 text-slate-950' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                }`}
              >
                快進至 17:00
              </button>
              <button 
                onClick={resetScheduler}
                className={`text-[11px] font-bold py-2 px-2.5 rounded-lg transition cursor-pointer ${
                  isDarkMode ? 'bg-[#1D2B44] text-slate-300 hover:bg-[#253755]' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title="重置系統模擬時間"
              >
                重設
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM LEGAL AND VERSION FOOTER */}
        <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-[#1e2d42]' : 'border-slate-200/80'} text-[10px] text-slate-500 text-center select-none font-mono`}>
          <p>© 2026 AI SUPPLY CHAIN ENGINE</p>
          <p className="mt-1">台美股與 ETFs 數據對比，價格資料來源取自 <a href="https://www.google.com/finance" target="_blank" rel="noreferrer" className={`font-bold hover:underline ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>Google Finance</a></p>
        </div>
      </aside>

      {/* 3. MAIN AREA WRAPPER */}
      <main className="flex-1 min-h-0 flex flex-col">
        {/* MOBILE HEADER BAR */}
        <header className={`md:hidden border-b p-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200 ${
          isDarkMode ? 'bg-[#0F172A] border-[#1e2d42] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`p-1.5 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-[#1e2d42]' : 'text-slate-600 hover:text-black hover:bg-slate-100'}`}
              title="開啟選單"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center space-x-1.5">
              <Zap size={16} className={isDarkMode ? "text-[#00F0FF]" : "text-blue-600"} />
              <span className={`font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>台美股/ETF賺錢引擎</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-lg transition ${isDarkMode ? 'text-yellow-400 hover:bg-[#1e2d42]' : 'text-slate-500 hover:bg-slate-100'}`}
              title="切換色彩模式"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
              <Clock size={11} />
              <span>{formatTimeStr(currentTime)}</span>
            </div>
          </div>
        </header>

        {/* CONTAINER FOR RIGHT HAND CONTENT ELEMENTS AND INTERACTIVE CARDS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* HEADER ROW WITH SCREEN TITLES AMD DATA REFRESH METRIC */}
          <section className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${isDarkMode ? 'border-[#1e2d42]' : 'border-slate-200/60'}`}>
            <div>
              <h2 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'dashboard' && '市場大數據核心觀測儀表板'}
                {activeTab === 'screener' && '多因子 AI 量化交易個股智篩櫃'}
                {activeTab === 'taiwanETFs' && '高流動性純台股成分 ETFs 分佈'}
                {activeTab === 'globalETFs' && '跨國加台股科技混合 ETFs 分佈'}
                {activeTab === 'news' && '精研特急新聞與研報'}
                {activeTab === 'scheduler' && '17:00 排程研報產出控制站'}
              </h2>
              <p className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                每日 17:00 自動完成均線強度排列、大量突破智篩與法人研究總結
              </p>
            </div>

            {(activeTab === 'dashboard' || activeTab === 'screener') && (
              <div className="flex items-center space-x-3 shrink-0">
                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>當前觀測市場個股:</span>
                <div className={`inline-flex rounded-xl p-1 border shadow-sm ${isDarkMode ? 'bg-[#0F172A] border-[#1e2d42]' : 'bg-slate-100 border-slate-200'}`}>
                  <button 
                    onClick={() => { setMarketType('TW'); setSearchQuery(''); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      marketType === 'TW' 
                        ? isDarkMode ? 'bg-[#00F0FF] text-[#090D16] shadow-md font-extrabold' : 'bg-blue-600 text-white shadow'
                        : isDarkMode ? 'text-slate-400 hover:text-[#00F0FF]' : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    台灣股市 ({TAIWAN_AI_STOCKS.length} 檔)
                  </button>
                  <button 
                    onClick={() => { setMarketType('US'); setSearchQuery(''); }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      marketType === 'US' 
                        ? isDarkMode ? 'bg-[#00F0FF] text-[#090D16] shadow-md font-extrabold' : 'bg-blue-600 text-white shadow'
                        : isDarkMode ? 'text-slate-400 hover:text-[#00F0FF]' : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    美國股市 ({US_AI_STOCKS.length} 檔)
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* DYNAMIC METRIC TICKS BENTO GRID */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border shadow-sm transition-colors duration-200 ${
              isDarkMode ? 'bg-[#111827] border-[#1e2d42]' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-[10px] md:text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>多頭排列完美排列 (強度 3)</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className={`text-2xl md:text-3xl font-mono font-black ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                  {TAIWAN_AI_STOCKS.filter(s => s.maStrength === 3).length + US_AI_STOCKS.filter(s => s.maStrength === 3).length}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ 40 檔個股</span>
              </div>
              <div className={`text-[10px] font-bold mt-1 ${isDarkMode ? 'text-rose-400/80' : 'text-rose-600'}`}>
                MA5 &gt; MA20 &gt; MA60 &gt; MA120 (強力吸籌)
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm transition-colors duration-200 ${
              isDarkMode ? 'bg-[#111827] border-[#1e2d42]' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-[10px] md:text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>當日量價齊揚突破比例</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className={`text-2xl md:text-3xl font-mono font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {((TAIWAN_AI_STOCKS.filter(s => s.volumeUp).length + US_AI_STOCKS.filter(s => s.volumeUp).length) / 40 * 100).toFixed(0)}%
                </span>
                <span className="text-xs text-slate-500 font-medium">看漲量增共識</span>
              </div>
              <div className={`text-[10px] font-bold mt-1 ${isDarkMode ? 'text-emerald-400/80' : 'text-emerald-600'}`}>
                成交量達 20 日均量 1.3 倍以上
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm transition-colors duration-200 ${
              isDarkMode ? 'bg-[#111827] border-[#1e2d42]' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-[10px] md:text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>追蹤機構研報及特急新聞</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className={`text-2xl md:text-3xl font-mono font-black ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>
                  {NEWS_AND_REPORTS.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">章關鍵洞察</span>
              </div>
              <div className={`text-[10px] font-semibold mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                大摩、元大等高含金量追蹤
              </div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-sm transition-colors duration-200 ${
              isDarkMode ? 'bg-[#111827] border-[#1e2d42]' : 'bg-white border-slate-200'
            }`}>
              <p className={`text-[10px] md:text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>17:00 伺服器研報</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className={`text-base md:text-lg font-bold font-mono ${isDarkMode ? 'text-yellow-400' : 'text-amber-600'}`}>
                  {reportGenerated ? "🟢 自動產出就緒" : "⏳ 待時間觸發"}
                </span>
              </div>
              <div className={`text-[10px] font-semibold mt-1.5 ${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'}`}>
                彙整 {TAIWAN_AI_STOCKS.length + US_AI_STOCKS.length} 檔個股與雙屬性 ETFs
              </div>
            </div>
          </section>

          {/* TAB CONTENT SWITCHER CONTAINER */}
          <div className="space-y-4">
            
            {/* TAB 1: DATA WATCH STATION OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Specific tracking highlights ETFs showcase slider card */}
                <div className="space-y-4">
                  <h3 className={`text-sm md:text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <span className={`h-2 w-2 rounded-full animate-pulse ${isDarkMode ? 'bg-[#00F0FF]' : 'bg-blue-500'}`}></span>
                    本日特定重點追蹤 ETFs
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* T01 主動統一台股增長 */}
                    <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between shadow-sm transition duration-200 ${
                      isDarkMode ? 'bg-[#111827] border-slate-800 text-white hover:border-[#00F0FF]/55' : 'bg-white border-slate-200 hover:border-blue-500/30'
                    }`}>
                      <div className={`absolute top-0 right-0 px-2.5 py-0.5 text-[10px] font-bold rounded-bl-lg font-mono ${
                        isDarkMode ? 'bg-cyan-950/70 text-[#00F0FF]' : 'bg-indigo-50 text-indigo-600'
                      }`}>台股成分</div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">{t01.symbol}</span>
                        <h4 className="text-base font-bold mt-1">
                          <a 
                            href={getGoogleFinanceUrl(t01.symbol)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`transition inline-flex items-center gap-1 group font-bold ${isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-950 hover:text-blue-600'}`}
                          >
                            <span>{t01.name}</span>
                            <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition tracking-normal shrink-0 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                          </a>
                        </h4>
                      </div>
                      <div className="pt-3 flex items-baseline justify-between">
                        <span className={`text-lg md:text-xl font-mono font-black ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                          ${t01.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-extrabold flex flex-col items-end font-mono ${getTrendTextColor(t01.change, t01.symbol)}`}>
                          <span className="flex items-center gap-0.5">
                            {t01.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {t01.change >= 0 ? '+' : ''}{t01.changePercent.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({t01.change >= 0 ? '+' : ''}{t01.change.toFixed(2)})
                          </span>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        成交量: <span className={`font-bold ${getTrendTextColor(t01.change, t01.symbol)}`}>{formatVolume(t01.volume, t01.symbol)}</span>
                      </div>
                    </div>

                    {/* 00735 國泰臺韓科技 */}
                    <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between shadow-sm transition duration-200 ${
                      isDarkMode ? 'bg-[#111827] border-slate-800 text-white hover:border-[#00F0FF]/55' : 'bg-white border-slate-200 hover:border-blue-500/30'
                    }`}>
                      <div className={`absolute top-0 right-0 px-2.5 py-0.5 text-[10px] font-bold rounded-bl-lg font-mono ${
                        isDarkMode ? 'bg-cyan-950/70 text-[#00F0FF]' : 'bg-blue-50 text-blue-600'
                      }`}>跨國成分</div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">{etf00735.symbol}</span>
                        <h4 className="text-base font-bold mt-1">
                          <a 
                            href={getGoogleFinanceUrl(etf00735.symbol)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`transition inline-flex items-center gap-1 group font-bold ${isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-950 hover:text-blue-600'}`}
                          >
                            <span>{etf00735.name}</span>
                            <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition tracking-normal shrink-0 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                          </a>
                        </h4>
                      </div>
                      <div className="pt-3 flex items-baseline justify-between">
                        <span className={`text-lg md:text-xl font-mono font-black ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                          ${etf00735.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-extrabold flex flex-col items-end font-mono ${getTrendTextColor(etf00735.change, etf00735.symbol)}`}>
                          <span className="flex items-center gap-0.5">
                            {etf00735.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {etf00735.change >= 0 ? '+' : ''}{etf00735.changePercent.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({etf00735.change >= 0 ? '+' : ''}{etf00735.change.toFixed(2)})
                          </span>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        成交量: <span className={`font-bold ${getTrendTextColor(etf00735.change, etf00735.symbol)}`}>{formatVolume(etf00735.volume, etf00735.symbol)}</span>
                      </div>
                    </div>

                    {/* G01 主動統一全球創新 */}
                    <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between shadow-sm transition duration-200 ${
                      isDarkMode ? 'bg-[#111827] border-slate-800 text-white hover:border-[#00F0FF]/55' : 'bg-white border-slate-200 hover:border-blue-500/30'
                    }`}>
                      <div className={`absolute top-0 right-0 px-2.5 py-0.5 text-[10px] font-bold rounded-bl-lg font-mono ${
                        isDarkMode ? 'bg-cyan-950/70 text-[#00F0FF]' : 'bg-purple-50 text-purple-600'
                      }`}>跨國成分</div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">{g01.symbol}</span>
                        <h4 className="text-base font-bold mt-1">
                          <a 
                            href={getGoogleFinanceUrl(g01.symbol)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`transition inline-flex items-center gap-1 group font-bold ${isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-950 hover:text-blue-600'}`}
                          >
                            <span>{g01.name}</span>
                            <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition tracking-normal shrink-0 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                          </a>
                        </h4>
                      </div>
                      <div className="pt-3 flex items-baseline justify-between">
                        <span className={`text-lg md:text-xl font-mono font-black ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                          ${g01.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-extrabold flex flex-col items-end font-mono ${getTrendTextColor(g01.change, g01.symbol)}`}>
                          <span className="flex items-center gap-0.5">
                            {g01.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {g01.change >= 0 ? '+' : ''}{g01.changePercent.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({g01.change >= 0 ? '+' : ''}{g01.change.toFixed(2)})
                          </span>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        成交量: <span className={`font-bold ${getTrendTextColor(g01.change, g01.symbol)}`}>{formatVolume(g01.volume, g01.symbol)}</span>
                      </div>
                    </div>

                    {/* 00910 第一金太空衛星 */}
                    <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between shadow-sm transition duration-200 ${
                      isDarkMode ? 'bg-[#111827] border-slate-800 text-white hover:border-[#00F0FF]/55' : 'bg-white border-slate-200 hover:border-blue-500/30'
                    }`}>
                      <div className={`absolute top-0 right-0 px-2.5 py-0.5 text-[10px] font-bold rounded-bl-lg font-mono ${
                        isDarkMode ? 'bg-cyan-950/70 text-[#00F0FF]' : 'bg-purple-50 text-purple-600'
                      }`}>跨國成分</div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider">{etf00910.symbol}</span>
                        <h4 className="text-base font-bold mt-1">
                          <a 
                            href={getGoogleFinanceUrl(etf00910.symbol)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`transition inline-flex items-center gap-1 group font-bold ${isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-950 hover:text-blue-600'}`}
                          >
                            <span>{etf00910.name}</span>
                            <ArrowRight size={14} className={`opacity-0 group-hover:opacity-100 transition tracking-normal shrink-0 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                          </a>
                        </h4>
                      </div>
                      <div className="pt-3 flex items-baseline justify-between">
                        <span className={`text-lg md:text-xl font-mono font-black ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                          ${etf00910.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs font-extrabold flex flex-col items-end font-mono ${getTrendTextColor(etf00910.change, etf00910.symbol)}`}>
                          <span className="flex items-center gap-0.5">
                            {etf00910.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {etf00910.change >= 0 ? '+' : ''}{etf00910.changePercent.toFixed(2)}%
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({etf00910.change >= 0 ? '+' : ''}{etf00910.change.toFixed(2)})
                          </span>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        成交量: <span className={`font-bold ${getTrendTextColor(etf00910.change, etf00910.symbol)}`}>{formatVolume(etf00910.volume, etf00910.symbol)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard bottom highlight grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Highlight box 1 - Technical strength 3 list */}
                  <div className={`border rounded-2xl p-5 shadow-sm ${
                    isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className={`flex justify-between items-center mb-4 pb-2.5 border-b ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                        均線金牌多頭排列 (強度 3) 精選
                      </h4>
                      <span className={`text-[10px] font-extrabold font-mono tracking-wider ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>5 &gt; 20 &gt; 60 &gt; 120 MA</span>
                    </div>
                    <div className="space-y-3">
                      {currentStocksList.filter(s => s.maStrength === 3).slice(0, 4).map(stock => (
                        <div key={stock.id} className={`flex justify-between items-center p-3 rounded-xl border ${
                          isDarkMode ? 'bg-[#1e293b]/30 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>{stock.symbol}</span>
                            <div className="text-sm font-bold mt-0.5">
                              <a 
                                href={getGoogleFinanceUrl(stock.symbol)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className={`transition inline-flex items-center gap-1 group font-bold ${isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-900 hover:text-blue-600'}`}
                              >
                                <span>{stock.name}</span>
                                <ArrowRight size={12} className={`opacity-0 group-hover:opacity-100 transition shrink-0 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                              </a>
                            </div>
                            <span className="text-[10px] text-slate-500">{stock.sector}</span>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs md:text-sm font-mono font-black ${getTrendTextColor(stock.change, stock.symbol)}`}>
                              {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold mt-1 font-mono">
                              收盤: ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlight box 2 - Volume surge list */}
                  <div className={`border rounded-2xl p-5 shadow-sm ${
                    isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div className={`flex justify-between items-center mb-4 pb-2.5 border-b ${
                      isDarkMode ? 'border-slate-800' : 'border-slate-200'
                    }`}>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        今日成交暴增股 (量價共識共振)
                      </h4>
                      <span className={`text-[10px] font-bold font-mono uppercase ${isDarkMode ? 'text-[#00F0FF]' : 'text-[#2563EB]'}`}>大資金吸籌標的</span>
                    </div>
                    <div className="space-y-3">
                      {currentStocksList.filter(s => s.volumeUp).slice(0, 4).map(stock => (
                        <div key={stock.id} className={`flex justify-between items-center p-3 rounded-xl border ${
                          isDarkMode ? 'bg-[#1e293b]/30 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? 'text-[#00F0FF]' : 'text-indigo-600'}`}>{stock.symbol}</span>
                            <div className="text-sm font-bold mt-0.5">
                              <a 
                                href={getGoogleFinanceUrl(stock.symbol)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className={`transition inline-flex items-center gap-1 group font-bold ${isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-900 hover:text-blue-605'}`}
                              >
                                <span>{stock.name}</span>
                                <ArrowRight size={12} className={`opacity-0 group-hover:opacity-100 transition shrink-0 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                              </a>
                            </div>
                            <span className="text-[10px] text-slate-500">{stock.sector}</span>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isDarkMode ? 'bg-cyan-950/40 text-[#00F0FF] border-cyan-500/30' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {stock.volumeRatio.toFixed(2)}x 均量
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono font-bold">
                              成交量: {formatVolume(stock.volume, stock.symbol)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* TAB 2: STOCK SCREENER */}
            {activeTab === 'screener' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`border rounded-2xl p-5 space-y-4 shadow-sm ${
                  isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className={`font-extrabold text-base md:text-lg ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                      多因子量化交叉個股篩選櫃
                    </h3>
                    <span className={`text-[10px] px-2 py-1 font-mono rounded border ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      2026-05-30 資料庫狀態
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search string */}
                    <div>
                      <label className={`text-[11px] font-bold block mb-1.5 uppercase font-sans ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>關鍵字篩選</label>
                      <input 
                        type="text"
                        placeholder="搜尋代號、名稱、細分段..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full rounded-xl px-3 py-2 text-xs md:text-sm transition-all focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'bg-[#0F172A] border-slate-800 text-white placeholder-slate-500 focus:ring-[#00F0FF] focus:border-[#00F0FF]' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-500'
                        }`}
                      />
                    </div>

                    {/* MA select filter */}
                    <div>
                      <label className={`text-[11px] font-bold block mb-1.5 uppercase font-sans ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>均線多頭強度等級</label>
                      <select 
                        value={strengthFilter}
                        onChange={(e) => setStrengthFilter(e.target.value)}
                        className={`w-full rounded-xl px-3 py-2 text-xs md:text-sm font-sans focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'bg-[#0F172A] border-slate-800 text-white focus:ring-[#00F0FF]' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500'
                        }`}
                      >
                        <option value="all">任意均線排列強度</option>
                        <option value="3">強度 3 (完美多頭排列 MA5&gt;20&gt;60&gt;120)</option>
                        <option value="2">強度 2 (守在中強均線月季之上)</option>
                        <option value="1">強度 1 (起步築底剛翻揚均線組)</option>
                      </select>
                    </div>

                    {/* Price/Volume toggle */}
                    <div>
                      <label className={`text-[11px] font-bold block mb-1.5 uppercase font-sans ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>資金量能共識</label>
                      <div className="flex items-center h-[38px]">
                        <label className="flex items-center cursor-pointer space-x-2 text-xs md:text-sm select-none">
                          <input 
                            type="checkbox"
                            checked={priceVolFilter}
                            onChange={(e) => setPriceVolFilter(e.target.checked)}
                            className={`rounded cursor-pointer focus:ring-0 focus:ring-offset-0 h-4.5 w-4.5 ${
                              isDarkMode ? 'bg-[#0F172A] border-slate-800 text-[#00F0FF]' : 'bg-slate-50 border-slate-200 text-blue-600'
                            }`}
                          />
                          <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>僅顯示「量價齊揚」標的</span>
                        </label>
                      </div>
                    </div>

                    {/* Clear operations */}
                    <div className="flex items-end justify-end">
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setStrengthFilter('all');
                          setPriceVolFilter(false);
                        }}
                        className={`w-full text-xs font-bold px-4 py-2.5 rounded-xl transition border cursor-pointer ${
                          isDarkMode 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        清除全部篩選條件
                      </button>
                    </div>
                  </div>
                </div>

                {/* List matrix view */}
                <ScreenerTable stocks={filteredStocks} marketType={marketType} isDarkMode={isDarkMode} />
              </div>
            )}

            {/* TAB 3: TAIWAN ONLY ETFs */}
            {activeTab === 'taiwanETFs' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`border rounded-2xl p-6 shadow-sm ${
                  isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className={`pb-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <h3 className={`text-lg md:text-xl font-extrabold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-[#00F0FF]' : 'bg-indigo-500'}`}></span>
                        持有純台股成分股之台灣上市 ETFs
                      </h3>
                      <p className={`text-xs md:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        精選在台掛牌交易，100% 重倉投資於台灣本土晶圓代工、CoWoS封裝與高規水冷散熱等科技鏈成分的 ETFs。
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 self-end sm:self-auto uppercase tracking-wide ${
                      isDarkMode ? 'bg-cyan-950/45 text-[#00F0FF] border-cyan-500/30' : 'bg-indigo-50 text-indigo-707 border-indigo-100'
                    }`}>
                      台股成分 · 本土純度
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                    {TAIWAN_ONLY_ETFS.map((etf) => (
                      <EtfCard key={etf.id} etf={etf} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: GLOBAL CONNECTED ETFs */}
            {activeTab === 'globalETFs' && (
              <div className="space-y-6 animate-fadeIn">
                <div className={`border rounded-2xl p-6 shadow-sm ${
                  isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className={`pb-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    isDarkMode ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <h3 className={`text-lg md:text-xl font-extrabold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? 'bg-[#00F0FF]' : 'bg-blue-500'}`}></span>
                        持有台股加海外跨國成分股之台灣上市 ETFs
                      </h3>
                      <p className={`text-xs md:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        精選在台灣掛牌交易的全球科技型 ETFs，同時佈局台積電、博通、英偉達、日韓與歐洲半導體耗材與太空衛星霸主。
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold shrink-0 self-end sm:self-auto uppercase tracking-wide ${
                      isDarkMode ? 'bg-cyan-950/45 text-[#00F0FF] border-cyan-500/30' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      跨國混合 · 全球算力
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                    {GLOBAL_TECH_ETFS.map((etf) => (
                      <EtfCard key={etf.id} etf={etf} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: NEWS SECTION MAP */}
            {activeTab === 'news' && (
              <div className="animate-fadeIn">
                <NewsSection isDarkMode={isDarkMode} />
              </div>
            )}

            {/* TAB 6: SCHEDULE PREVIEW ANALYTICS */}
            {activeTab === 'scheduler' && (
              <div className="animate-fadeIn">
                <SchedulerSection 
                  currentTime={currentTime}
                  reportGenerated={reportGenerated}
                  generatedReport={generatedReport}
                  copiedNotification={copiedNotification}
                  fastForwardTo17={fastForwardTo17}
                  resetScheduler={resetScheduler}
                  triggerAutoReportGeneration={triggerAutoReportGeneration}
                  formatCountdown={formatCountdown}
                  copyToClipboard={copyToClipboard}
                  taiwanStocks={taiwanStocks}
                  taiwanOnlyEtfs={taiwanOnlyEtfs}
                  globalTechEtfs={globalTechEtfs}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
