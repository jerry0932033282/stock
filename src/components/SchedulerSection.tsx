/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, Zap, RotateCcw, Copy, Check, FileText, Download, Loader2 } from 'lucide-react';
import { TAIWAN_AI_STOCKS, US_AI_STOCKS, TAIWAN_ONLY_ETFS, GLOBAL_TECH_ETFS, NEWS_AND_REPORTS } from '../data.ts';
import { getTrendTextColor, getTrendBgColor, formatVolume } from '../utils.ts';
import { Stock } from '../types.ts';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface SchedulerSectionProps {
  currentTime: Date;
  reportGenerated: boolean;
  generatedReport: string;
  copiedNotification: boolean;
  fastForwardTo15: () => void;
  resetScheduler: () => void;
  triggerAutoReportGeneration: () => void;
  formatCountdown: () => string;
  copyToClipboard: (text: string) => void;
  taiwanStocks: Stock[];
  taiwanOnlyEtfs: any[];
  globalTechEtfs: any[];
  usStocks?: Stock[];
  isDarkMode?: boolean;
}

export default function SchedulerSection({
  currentTime,
  reportGenerated,
  generatedReport,
  copiedNotification,
  fastForwardTo15,
  resetScheduler,
  triggerAutoReportGeneration,
  formatCountdown,
  copyToClipboard,
  taiwanStocks,
  taiwanOnlyEtfs,
  globalTechEtfs,
  usStocks,
  isDarkMode = false
}: SchedulerSectionProps) {

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const usStocksList = usStocks || US_AI_STOCKS;

  const strongTW = taiwanStocks.filter(s => s.maStrength === 3);
  const strongUS = usStocksList.filter(s => s.maStrength === 3);
  const strongTWEtfs = taiwanOnlyEtfs.filter(e => e.maStrength === 3);
  const strongGlobalEtfs = globalTechEtfs.filter(e => e.maStrength === 3);

  const downloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('report-pdf-template');
      if (!element) {
        throw new Error('PDF template element not found');
      }

      const opt = {
        margin:       [12, 12, 12, 12], // margin in mm
        filename:     'AI_SUPPLY_CHAIN_DAILY_REPORT_1700.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation crash handler:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dynamic Scheduling dashboard block */}
      <div className={`border rounded-2xl p-6 shadow-sm ${
        isDarkMode ? 'bg-[#111827] border-slate-805 text-white' : 'bg-white border-slate-200 text-slate-80o'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className={`text-lg md:text-xl font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                15:00 自動報告排程排程器 ({taiwanStocks.length + usStocksList.length}檔個股 + {taiwanOnlyEtfs.length + globalTechEtfs.length}檔台灣掛牌ETF)
              </h3>
            </div>
            <p className={`text-xs md:text-sm max-w-4xl leading-relaxed font-semibold ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              系統每日下午 15:00 排程自動彙整台美大數據，統計包含台灣 {taiwanStocks.length} 檔 AI 關鍵股、美國 {usStocksList.length} 檔 AI 重量權值股，以及合計 {taiwanOnlyEtfs.length + globalTechEtfs.length} 檔在台上市掛牌的多領域 ETFs。收盤秒級完成除權息與大額基金拆股等最新交叉數據庫對比，自動校驗均線強度並產出最新研報。
            </p>
          </div>
          
          <div className="flex flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0 self-start md:self-auto w-full md:w-auto">
            <div className={`flex-1 md:flex-initial border px-4 py-3 rounded-2xl text-center min-w-[130px] ${
              isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[10px] block uppercase font-bold tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>當前模擬時間</span>
              <span className={`text-lg font-mono font-extrabold ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>
                {currentTime.toTimeString().split(' ')[0]}
              </span>
            </div>

            <div className={`flex-1 md:flex-initial border px-4 py-3 rounded-2xl text-center min-w-[130px] ${
              isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[10px] block uppercase font-bold tracking-wider font-sans ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>每日排程觸發</span>
              <span className={`text-lg font-extrabold font-mono ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>15:00:00</span>
            </div>
          </div>
        </div>

        {/* Status indicator Alert bar */}
        <div className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="space-y-0.5">
            <h4 className={`text-xs md:text-sm font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Clock size={14} className={isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'} />
              自動化排程狀態報告
            </h4>
            <p className={`text-xs leading-relaxed font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {reportGenerated 
                ? "✨ 今日產業研報已於 15:00:00 自動觸發生成。下方展示高度規格化的 Markdown 分析與統計，可一鍵點選複製。"
                : `⏳ 背景待命計時中，距離自動產出尚有 ${formatCountdown()}。您可以隨時點擊右側按鈕跳過計時，強制觸發。`
              }
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto self-end sm:self-auto shrink-0 mt-2 sm:mt-0">
            {!reportGenerated ? (
              <button 
                onClick={triggerAutoReportGeneration}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[#00F0FF]/10' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Zap size={12} />
                強制模擬生成
              </button>
            ) : (
              <button 
                onClick={resetScheduler}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-805 border-slate-700 text-slate-200 hover:bg-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-205 text-slate-700 border-slate-200'
                }`}
              >
                <RotateCcw size={12} />
                重啟排程監測
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compiled Report Screen Render Box */}
      {reportGenerated ? (
        <div className="space-y-6">
          <div className={`border rounded-2xl overflow-hidden shadow-sm ${
            isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-202'
          }`}>
            {/* Header toolbar */}
            <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isDarkMode ? 'border-slate-805 bg-[#0f172a] text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-emerald-500" />
                <span className="font-extrabold text-xs md:text-sm truncate">
                  AI_SUPPLY_CHAIN_DAILY_REPORT_1500.md (本日深度大數據特寫)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 self-end sm:self-auto w-full sm:w-auto shrink-0">
                <button
                  onClick={downloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm shrink-0 self-end sm:self-auto w-full sm:w-auto cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>正在產出 PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download size={13} />
                      <span>下載 PDF 研報</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => copyToClipboard(generatedReport)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-2 border shrink-0 self-end sm:self-auto w-full sm:w-auto shadow-sm cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/80 border-slate-700 text-slate-100 hover:bg-slate-700' 
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-250'
                  }`}
                >
                  {copiedNotification ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span className="text-emerald-500">已複製到剪貼簿!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} className={isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'} />
                      <span>複製 Markdown 內容</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Styled markdown output screen */}
            <div className={`p-4 md:p-6 font-mono text-xs md:text-sm max-h-[550px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-text border-t ${
              isDarkMode ? 'bg-[#09090D] text-slate-200 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-100'
            }`}>
              {generatedReport}
            </div>
          </div>

          {/* HIDDEN PRINT-READY TEMPLATE Container (Rendered exactly with clean tables and formatting) */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div id="report-pdf-template" className="w-[794px] bg-white text-slate-800 font-sans text-xs leading-relaxed" style={{ width: '794px', backgroundColor: '#ffffff', color: '#1e293b' }}>
              
              {/* PAGE 1: Header / News & Summary / Taiwan AI Stocks Table */}
              <div className="p-8 space-y-6">
                {/* Header design banner */}
                <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-end">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                      <span className="text-[10px] uppercase font-black tracking-wider text-blue-600">DAILY STRATEGY DECISION REPORT</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">📈 AI 產業供應鏈每日決策報告 (每日 15:00)</h1>
                    <p className="text-[10px] text-slate-500 font-medium">資料庫確認時間: 2026-05-30 15:00:00 (自動研報引擎已彙總最新除權息數據) | 價格來源: Google Finance</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-slate-100 text-slate-800 font-mono text-[9px] font-bold px-2 py-1 rounded">
                      頁次 1 / 3
                    </span>
                  </div>
                </div>

                {/* Section 1: Markets Highlights Summary */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-l-4 border-blue-600 pl-2">
                    <h2 className="text-sm font-extrabold text-slate-900">一、 核心市場摘要與最新新聞、研報綜述</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-bold">台灣 AI 核心股多頭強度 3 比例</span>
                      <div className="text-base font-black text-blue-700 mt-1 font-mono">
                        {(strongTW.length / TAIWAN_AI_STOCKS.length * 100).toFixed(1)}% 
                        <span className="text-xs text-slate-500 font-normal ml-1">({strongTW.length} / {TAIWAN_AI_STOCKS.length} 檔)</span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                        多頭完美排列 (MA5 &gt; MA20 &gt; MA60 &gt; MA120) 比例。
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block font-bold">美國 AI 核心股多頭強度 3 比例</span>
                      <div className="text-base font-black text-emerald-700 mt-1 font-mono">
                        {(strongUS.length / usStocksList.length * 100).toFixed(1)}%
                        <span className="text-xs text-slate-500 font-normal ml-1">({strongUS.length} / {usStocksList.length} 檔)</span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1 leading-normal">
                        美國重權值 AI 晶片霸主多頭排列比例及資金強流入指標。
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div className="flex items-start gap-1">
                      <span className="font-extrabold text-blue-600 mr-1">•</span>
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-slate-900">今日最關鍵新聞</strong>: 《{NEWS_AND_REPORTS[1].title}》
                        <span className="text-[10px] text-slate-500 ml-1">({NEWS_AND_REPORTS[1].source})</span>
                        <br />
                        <span className="text-[10px] text-slate-600">{NEWS_AND_REPORTS[1].summary}</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-extrabold text-blue-600 mr-1">•</span>
                      <p className="text-[11px] leading-relaxed">
                        <strong className="text-slate-900">最新重磅研報</strong>: 《{NEWS_AND_REPORTS[3].title}》
                        <span className="text-[10px] text-slate-500 ml-1">({NEWS_AND_REPORTS[3].source})</span>
                        <br />
                        <span className="text-[10px] text-slate-600">調升大型 ASIC 晶片目標價：聯發科自 1500 上調至 {NEWS_AND_REPORTS[3].targetPrices?.[0].tp}，博通自 1550 上調至 {NEWS_AND_REPORTS[3].targetPrices?.[1].tp}。</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Taiwan AI Stocks Table */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-l-4 border-blue-600 pl-2">
                    <h2 className="text-sm font-extrabold text-slate-900">二、 台灣 AI 供應鏈核心數據彙整 (11 檔個股)</h2>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold">
                          <th className="py-2 px-2.5 w-[110px]">股號/股名</th>
                          <th className="py-2 px-1.5 w-[140px]">產業板塊</th>
                          <th className="py-2 px-1 text-right w-[80px]">收盤價 (NT$)</th>
                          <th className="py-2 px-1.5 text-right w-[75px]">漲跌幅</th>
                          <th className="py-2 px-1.5 text-right w-[85px]">當日成交量</th>
                          <th className="py-2 px-1 w-[60px] text-center">均線強度</th>
                          <th className="py-2 px-2 text-right w-[160px]">三大法人淨買賣 (百萬)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {taiwanStocks.map((stock) => {
                          const isUp = stock.change >= 0;
                          return (
                            <tr key={stock.id} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-bold text-slate-900 truncate">
                                {stock.id} {stock.name}
                              </td>
                              <td className="py-1.5 px-1.5 text-slate-500 font-semibold truncate">
                                {stock.sector}
                              </td>
                              <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-800">
                                {stock.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(stock.change, stock.symbol)}`}>
                                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(stock.change, stock.symbol)}`}>
                                {formatVolume(stock.volume, stock.symbol)}
                              </td>
                              <td className="py-1.5 px-1 text-center font-mono text-amber-500 font-black text-xs">
                                {"★".repeat(stock.maStrength)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-[9px] text-slate-600 font-semibold truncate">
                                外:{stock.institutionalFlow.foreign >= 0 ? '+' : ''}{stock.institutionalFlow.foreign} | 投:{stock.institutionalFlow.investmentTrust >= 0 ? '+' : ''}{stock.institutionalFlow.investmentTrust} | 自:{stock.institutionalFlow.proprietary >= 0 ? '+' : ''}{stock.institutionalFlow.proprietary}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Page Break */}
              <div className="html2pdf__page-break" style={{ height: '0', margin: '0' }} />

              {/* PAGE 2: US AI Stocks Table / Taiwan ETFs Category A Table */}
              <div className="p-8 space-y-6">
                {/* Header design banner */}
                <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">📈 AI 產業供應鏈每日決策報告 (每日 15:00)</h1>
                    <p className="text-[9px] text-slate-500 font-medium">自動排程分析數據庫 | 全面覆蓋全球最領先 AI 半導體重權值股</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-slate-100 text-slate-800 font-mono text-[9px] font-bold px-2 py-1 rounded">
                      頁次 2 / 3
                    </span>
                  </div>
                </div>

                {/* Section 3: US AI Stocks Table */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-l-4 border-blue-600 pl-2">
                    <h2 className="text-sm font-extrabold text-slate-900">三、 美國 AI 供應鏈核心數據彙整 (11 檔重量個股)</h2>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold">
                          <th className="py-2 px-2.5 w-[110px]">Symbol/股名</th>
                          <th className="py-2 px-1.5 w-[160px]">產業板塊</th>
                          <th className="py-2 px-1 text-right w-[85px]">收盤價 (US$)</th>
                          <th className="py-2 px-1.5 text-right w-[75px]">漲跌幅</th>
                          <th className="py-2 px-1.5 text-right w-[85px]">當日成交量</th>
                          <th className="py-2 px-1 w-[60px] text-center">均線強度</th>
                          <th className="py-2 px-2 text-right w-[135px]">美股機構資金流向</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usStocksList.map((stock) => {
                          const isUp = stock.change >= 0;
                          return (
                            <tr key={stock.symbol} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5 font-bold text-slate-900 truncate">
                                {stock.symbol} {stock.name}
                              </td>
                              <td className="py-1.5 px-1.5 text-slate-500 font-semibold truncate">
                                {stock.sector}
                              </td>
                              <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-800">
                                {stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(stock.change, stock.symbol)}`}>
                                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(stock.change, stock.symbol)}`}>
                                {formatVolume(stock.volume, stock.symbol)}
                              </td>
                              <td className="py-1.5 px-1 text-center font-mono text-amber-500 font-black text-xs">
                                {"★".repeat(stock.maStrength)}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-[9px] text-slate-600 font-bold truncate">
                                淨流向: {stock.institutionalFlow.netInstitutionalUSD >= 0 ? '+' : ''}{stock.institutionalFlow.netInstitutionalUSD} 百萬 USD
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4 Part A: Taiwan ETFs Table */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-l-4 border-blue-600 pl-2">
                    <h2 className="text-sm font-extrabold text-slate-900">四、 台灣上市相關 AI ETFs 專區 - 類別 A：持有純台股成分股</h2>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold">
                          <th className="py-2 px-2.5 w-[115px]">ETF 代號/名稱</th>
                          <th className="py-2 px-1 text-right w-[85px]">收盤價 (NT$)</th>
                          <th className="py-2 px-1.5 text-right w-[75px]">漲跌幅</th>
                          <th className="py-2 px-1.5 text-right w-[85px]">成交量</th>
                          <th className="py-2 px-1 w-[60px] text-center">均線</th>
                          <th className="py-2 px-1 text-center w-[60px]">AI 純度</th>
                          <th className="py-2 px-2 w-[230px]">四大核心成分股</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {taiwanOnlyEtfs.map((etf) => {
                          const isUp = etf.change >= 0;
                          return (
                            <tr key={etf.id} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5">
                                <div className="font-bold text-slate-900 truncate">{etf.id} {etf.name}</div>
                              </td>
                              <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-800">
                                {etf.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(etf.change, etf.symbol)}`}>
                                {isUp ? '+' : ''}{etf.changePercent.toFixed(2)}%
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(etf.change, etf.symbol)}`}>
                                {formatVolume(etf.volume, etf.symbol)}
                              </td>
                              <td className="py-1.5 px-1 text-center font-mono font-semibold text-slate-700">
                                L{etf.maStrength}
                              </td>
                              <td className="py-1.5 px-1 text-center font-semibold text-blue-600">
                                {etf.aiPurity}
                              </td>
                              <td className="py-1.5 px-2 text-slate-500 font-semibold truncate text-[9px]">
                                {etf.topHoldings.map(h => `${h.name}(${h.weight}%)`).join('、')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Page Break */}
              <div className="html2pdf__page-break" style={{ height: '0', margin: '0' }} />

              {/* PAGE 3: Taiwan ETFs Category B / Strategy Conclusions & Disclaimer */}
              <div className="p-8 space-y-6">
                {/* Header design banner */}
                <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">📈 AI 產業供應鏈每日決策報告 (每日 15:00)</h1>
                    <p className="text-[9px] text-slate-500 font-medium">跨國資產追蹤與全球供應鏈多因子資產配比結論</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block bg-slate-100 text-slate-800 font-mono text-[9px] font-bold px-2 py-1 rounded">
                      頁次 3 / 3
                    </span>
                  </div>
                </div>

                {/* Section 4 Part B: Global/Tech ETFs Table */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-l-4 border-blue-600 pl-2">
                    <h2 className="text-sm font-extrabold text-slate-900">四、 台灣上市相關 AI ETFs 專區 - 類別 B：持有台股加海外跨國成分股</h2>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold">
                          <th className="py-2 px-2.5 w-[115px]">ETF 代號/名稱</th>
                          <th className="py-2 px-1 text-right w-[85px]">收盤價 (NT$)</th>
                          <th className="py-2 px-1.5 text-right w-[75px]">漲跌幅</th>
                          <th className="py-2 px-1.5 text-right w-[85px]">成交量</th>
                          <th className="py-2 px-1 w-[60px] text-center">均線</th>
                          <th className="py-2 px-1 text-center w-[60px]">全球純度</th>
                          <th className="py-2 px-2 w-[230px]">四大核心成分股</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {globalTechEtfs.map((etf) => {
                          const isUp = etf.change >= 0;
                          return (
                            <tr key={etf.id} className="hover:bg-slate-50/50">
                              <td className="py-1.5 px-2.5">
                                <div className="font-bold text-slate-900 truncate">{etf.id} {etf.name}</div>
                              </td>
                              <td className="py-1.5 px-1 text-right font-mono font-bold text-slate-800">
                                {etf.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(etf.change, etf.symbol)}`}>
                                {isUp ? '+' : ''}{etf.changePercent.toFixed(2)}%
                              </td>
                              <td className={`py-1.5 px-1.5 text-right font-mono font-bold ${getTrendTextColor(etf.change, etf.symbol)}`}>
                                {formatVolume(etf.volume, etf.symbol)}
                              </td>
                              <td className="py-1.5 px-1 text-center font-mono font-semibold text-slate-700">
                                L{etf.maStrength}
                              </td>
                              <td className="py-1.5 px-1 text-center font-semibold text-emerald-600">
                                {etf.aiPurity}
                              </td>
                              <td className="py-1.5 px-2 text-slate-500 font-semibold truncate text-[9px]">
                                {etf.topHoldings.map(h => `${h.name}(${h.weight}%)`).join('、')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 5: Strategies and Conclusions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 border-l-4 border-blue-600 pl-2">
                    <h2 className="text-sm font-extrabold text-slate-900">五、 策略交易與關鍵結論 (Key Strategy Conclusions)</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-200 p-4 rounded-xl space-y-1.5 bg-slate-50/50">
                      <span className="font-black text-blue-700 text-[10px] uppercase font-sans tracking-wide">液冷散熱與邊緣 AI 各領風騷</span>
                      <ul className="text-[10px] text-slate-600 space-y-1 font-semibold leading-normal list-decimal pl-4">
                        <li>散熱技術規格升級直接拉升產品 ASP 與毛利結構，奇鋐與雙鴻依舊是基本面最扎實的多頭完美排列（強度 3）首選。</li>
                        <li>大摩調升聯發科與博通之目標價，表明在算力昂貴的時代，ASIC 客製化晶片與邊緣運算正在迎來黃金發展期。</li>
                      </ul>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-xl space-y-1.5 bg-slate-50/50">
                      <span className="font-black text-emerald-700 text-[10px] uppercase font-sans tracking-wide">特定的多因子主動策略溢價</span>
                      <ul className="text-[10px] text-slate-600 space-y-1 font-semibold leading-normal list-decimal pl-4">
                        <li>主動操作的 <strong>【主動統一台股增長】</strong> 憑藉高持股靈活性（重倉散熱與先進製程），走勢持續強於被動指數。</li>
                        <li><strong>國泰臺韓科技 (00735)</strong> 兼顧計算與 HBM 記憶體，是當前降低美股波動風險的優質資產避風港。</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="pt-4 border-t border-slate-200 text-center">
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                    （本報告由系統於每日下午 15:00 自動產出，價格數據源自 Google Finance 谷歌財經，數據僅供策略研究參考，投資人應自行承擔交易風險，並建議落實嚴格資金控管手法。）
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className={`border rounded-2xl p-10 md:p-14 text-center shadow-sm ${
          isDarkMode ? 'bg-[#111827] border-slate-805 text-white' : 'bg-white border-slate-200 text-slate-850'
        }`}>
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
            isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <Clock size={24} className={isDarkMode ? 'text-[#00F0FF] animate-pulse' : 'text-slate-400 animate-pulse'} />
          </div>
          <h4 className={`font-extrabold text-base ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>自動排程監控中。尚未抵達每日 15:00 產出臨界點</h4>
          <p className={`text-xs max-w-lg mx-auto mt-2 leading-relaxed font-semibold ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            系統時間正以 10 倍高速運作中，您可以等待倒數自然流逝，也可以點選左下側的「快進至 15:00」或是點擊上方「強制模擬生成」直接提取彙總結果。
          </p>
        </div>
      )}

    </div>
  );
}
