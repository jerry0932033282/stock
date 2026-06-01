/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Stock } from '../types.ts';
import { TrendingUp, TrendingDown, HelpCircle, Award, Volume2, Target, ExternalLink } from 'lucide-react';
import { getGoogleFinanceUrl, getTrendTextColor, getTrendBgColor, formatVolume, getSectorSearchUrl } from '../utils.ts';

interface ScreenerTableProps {
  stocks: Stock[];
  marketType: 'TW' | 'US';
  isDarkMode?: boolean;
}

export default function ScreenerTable({ stocks, marketType, isDarkMode = false }: ScreenerTableProps) {
  if (stocks.length === 0) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${
        isDarkMode 
          ? 'bg-[#111827] border-slate-800 text-slate-400' 
          : 'bg-slate-50/50 border-slate-200 text-slate-500'
      }`}>
        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>沒有符合條件的 AI 個股</p>
        <p className="text-xs mt-1">請嘗試放寬篩選條件。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Google Finance Source Disclaimer */}
      <div className={`flex items-center justify-between border rounded-xl px-4 py-2.5 text-xs animate-fadeIn ${
        isDarkMode 
          ? 'bg-cyan-950/20 border-cyan-500/25 text-slate-350' 
          : 'bg-blue-50 border-blue-100 text-slate-600'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className={isDarkMode ? 'text-[#00F0FF] font-bold' : 'text-blue-600 font-bold'}>📊 價格來源安全聲明:</span>
          <span>所有收盤價格、當日成交量均串接與對比自 </span>
          <a 
            href="https://www.google.com/finance" 
            target="_blank" 
            rel="noreferrer" 
            className={`font-extrabold hover:underline inline-flex items-center gap-0.5 ${
              isDarkMode ? 'text-[#00F0FF]' : 'text-blue-605'
            }`}
          >
            Google Finance
            <ExternalLink size={10} />
          </a>
        </div>
        <span className="text-slate-500 hidden sm:inline font-medium">⚠️ 點擊個股名稱或代號可跳轉查看即時 K 線走勢</span>
      </div>

      {/* 1. MOBILE VIEW (Stacked card lists tailored for 400px screen) */}
      <div className="block md:hidden space-y-4">
        {stocks.map((stock) => {
          const isUp = stock.change >= 0;
          const twSum = marketType === 'TW' && stock.institutionalFlow.foreign && stock.institutionalFlow.investmentTrust && stock.institutionalFlow.proprietary
            ? stock.institutionalFlow.foreign + stock.institutionalFlow.investmentTrust + stock.institutionalFlow.proprietary
            : 0;

          return (
            <div 
              key={stock.id} 
              className={`border rounded-2xl p-4 space-y-3 shadow-sm transition ${
                isDarkMode 
                  ? 'bg-[#111827] border-slate-800 hover:border-[#00F0FF]/55' 
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
              id={`mobile-stock-${stock.id}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-base font-sans mt-0.5">
                    <a 
                      href={getGoogleFinanceUrl(stock.symbol)} 
                      target="_blank" 
                      rel="noreferrer"
                      className={`transition flex items-center gap-1.5 group font-bold ${
                        isDarkMode ? 'text-white hover:text-[#00F0FF]' : 'text-slate-900 hover:text-blue-600'
                      }`}
                    >
                      <span>{stock.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold flex items-center gap-0.5 transition ${
                        isDarkMode 
                          ? 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-[#00F0FF]' 
                          : 'bg-slate-100 text-slate-600 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}>
                        {stock.symbol}
                        <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                      </span>
                    </a>
                  </h4>
                  <a 
                    href={getSectorSearchUrl(stock.sector)}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-xs mt-1 font-semibold hover:underline flex items-center gap-0.5 ${
                      isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'
                    }`}
                  >
                    <span>{stock.sector}</span>
                    <ExternalLink size={10} className="opacity-70" />
                  </a>
                </div>
                
                <div className="text-right font-sans">
                  <div className={`font-mono font-bold text-base ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                    ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 flex justify-end">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-extrabold border ${getTrendBgColor(stock.change, stock.symbol)}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                      <span className="opacity-90">({isUp ? '+' : ''}{stock.change.toFixed(2)})</span>
                    </span>
                  </div>
                </div>
              </div>


              {/* Grid of details */}
              <div className={`grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl border ${
                isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div>
                  <span className={`block font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>當日成交量</span>
                  <span className={`font-mono font-bold ${getTrendTextColor(stock.change, stock.symbol)}`}>
                    {formatVolume(stock.volume, stock.symbol)}
                  </span>
                </div>
                <div>
                  <span className={`block font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>量價共識</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 border ${
                    stock.volumeUp 
                      ? (isDarkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-100') 
                      : (isDarkMode ? 'bg-slate-800 text-slate-350 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-205')
                  }`}>
                    <Volume2 size={10} />
                    {stock.volumeUp ? '量價齊揚' : '價量整理'}
                  </span>
                </div>
              </div>

              {/* MA Strength */}
              <div className={`flex items-center justify-between text-xs pt-1 border-t font-medium ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <span className="text-slate-505">均線強度排列:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    stock.maStrength === 3 ? (isDarkMode ? 'bg-rose-950/30 text-rose-450 border border-rose-900/50' : 'bg-rose-50 text-rose-700 border border-rose-105') :
                    stock.maStrength === 2 ? (isDarkMode ? 'bg-amber-950/30 text-amber-400 border border-amber-900/50' : 'bg-amber-50 text-amber-700 border border-amber-105') :
                    (isDarkMode ? 'bg-slate-800 text-slate-350 border border-slate-700' : 'bg-slate-100 text-slate-600 border border-slate-205')
                  }`}>
                    強度 {stock.maStrength}
                  </span>
                  <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {stock.maStrength === 3 ? "完美多頭" : stock.maStrength === 2 ? "均線守守" : "築底翻揚"}
                  </span>
                </div>
              </div>

              {/* Fund Flow */}
              <div className={`flex items-center justify-between text-xs pt-2 border-t font-mono p-2 rounded-xl border ${
                isDarkMode ? 'border-slate-80d0 bg-[#0f172a] border-slate-800' : 'border-slate-100 bg-slate-50'
              }`}>
                <span className="text-slate-505 flex items-center gap-1 font-sans font-medium">
                  <Target size={12} className={isDarkMode ? 'text-[#00F0FF]' : 'text-blue-500'} />
                  {marketType === 'TW' ? '三大法人今日合計' : '機構淨大單流'}
                </span>
                <span className={`font-bold ${
                  marketType === 'TW' 
                    ? twSum >= 0 ? 'text-emerald-500 font-extrabold' : 'text-rose-450 font-extrabold'
                    : (stock.institutionalFlow.netInstitutionalUSD ?? 0) >= 0 ? 'text-emerald-500 font-extrabold' : 'text-rose-450 font-extrabold'
                }`}>
                  {marketType === 'TW' 
                    ? `${twSum >= 0 ? '+' : ''}${twSum.toLocaleString()} 百萬`
                    : `${(stock.institutionalFlow.netInstitutionalUSD ?? 0) >= 0 ? '+' : ''}${stock.institutionalFlow.netInstitutionalUSD} M USD`
                  }
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. DESKTOP VIEW (Fine-tuned table layout optimized for up to 1440px desktop size) */}
      <div className={`hidden md:block border overflow-hidden rounded-2xl shadow-sm ${
        isDarkMode ? 'bg-[#111827] border-slate-800/80 shadow-md' : 'bg-white border-slate-202'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className={`uppercase text-xs tracking-wider border-b font-bold ${
                isDarkMode ? 'bg-[#0F172A] border-slate-805 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <th className="p-4 font-bold">股名/代號</th>
                <th className="p-4 font-bold">細分供應鏈定位</th>
                <th className="p-4 font-bold text-right">今日收盤價</th>
                <th className="p-4 font-bold text-right">漲跌 (幅)</th>
                <th className="p-4 font-bold text-right">當日成交量</th>
                <th className="p-4 font-bold text-center">多頭均線強度 (3&gt;2&gt;1)</th>
                <th className="p-4 font-bold text-center">量價共識</th>
                <th className="p-4 font-bold text-right">
                  {marketType === 'TW' ? '三大法人今日買賣超合計 (TWD)' : '機構大單淨流量 (USD)'}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
              {stocks.map((stock) => {
                const isUp = stock.change >= 0;
                const twSum = marketType === 'TW' && stock.institutionalFlow.foreign && stock.institutionalFlow.investmentTrust && stock.institutionalFlow.proprietary
                  ? stock.institutionalFlow.foreign + stock.institutionalFlow.investmentTrust + stock.institutionalFlow.proprietary
                  : 0;

                return (
                  <tr 
                    key={stock.id} 
                    className={`transition duration-100 ${isDarkMode ? 'hover:bg-slate-800/40 text-slate-100' : 'hover:bg-blue-50/20'}`} 
                    id={`desktop-stock-${stock.id}`}
                  >
                    {/* Stock Info */}
                    <td className="p-4">
                      <a 
                        href={getGoogleFinanceUrl(stock.symbol)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group flex flex-col hover:text-blue-600 transition"
                      >
                        <div className={`font-extrabold text-base flex items-center gap-1 group-hover:text-[#00F0FF] transition ${
                          isDarkMode ? 'text-white' : 'text-slate-900 font-bold'
                        }`}>
                          {stock.name}
                          <ExternalLink size={11} className={`opacity-0 group-hover:opacity-100 transition ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`} />
                        </div>
                        <div className={`text-xs font-mono mt-0.5 group-hover:text-[#00F0FF] transition ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stock.symbol}</div>
                      </a>
                    </td>

                    {/* Sector */}
                    <td className="p-4">
                      <a 
                        href={getSectorSearchUrl(stock.sector)}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition duration-150 ${
                          isDarkMode 
                            ? 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:border-[#00F0FF]/50 hover:text-[#00F0FF]' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/20'
                        }`}
                      >
                        <span>{stock.sector}</span>
                        <ExternalLink size={10} className="opacity-70" />
                      </a>
                    </td>

                    {/* Today Price */}
                    <td className={`p-4 text-right font-mono font-bold text-base ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
                      ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Price Change and Change% */}
                    <td className="p-4 text-right font-sans">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-extrabold border ${getTrendBgColor(stock.change, stock.symbol)}`}>
                        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        <span>{isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                        <span className="opacity-90 font-bold">({isUp ? '+' : ''}{stock.change.toFixed(2)})</span>
                      </span>
                    </td>

                    {/* Volume */}
                    <td className="p-4 text-right font-sans">
                      <div className={`font-mono font-extrabold text-base ${getTrendTextColor(stock.change, stock.symbol)}`}>
                        {formatVolume(stock.volume, stock.symbol)}
                      </div>
                    </td>

                    {/* MA Strength */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider shadow-sm border ${
                          stock.maStrength === 3 ? (isDarkMode ? 'bg-rose-950/40 text-rose-450 border border-rose-900/50' : 'bg-rose-50 text-rose-700 border-rose-250') :
                          stock.maStrength === 2 ? (isDarkMode ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-amber-50 text-amber-700 border-amber-250') :
                          (isDarkMode ? 'bg-slate-800 text-slate-350 border border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-205')
                        }`}>
                          強度等級: {stock.maStrength}
                        </span>
                        <span className={`text-[10px] font-mono mt-1 block max-w-[150px] truncate ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`} title={stock.maDescription}>
                          {stock.maStrength === 3 ? "5>20>60>120 完美多頭" : stock.maStrength === 2 ? "均線守住月季線" : "剛從底部翻揚"}
                        </span>
                      </div>
                    </td>

                    {/* Volume/Price confirm */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        stock.volumeUp 
                          ? (isDarkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200') 
                          : (isDarkMode ? 'bg-slate-800 text-slate-350 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                      }`}>
                        <Volume2 size={12} />
                        {stock.volumeUp ? '量價齊揚' : '價量整理'}
                      </span>
                    </td>

                    {/* Institutional Flow */}
                    <td className="p-4 text-right">
                      {marketType === 'TW' ? (
                        <div className="space-y-0.5">
                          <div className={`font-mono font-extrabold text-sm ${twSum >= 0 ? 'text-emerald-500' : 'text-rose-450'}`}>
                            {twSum >= 0 ? '+' : ''}{twSum.toLocaleString()} 百萬
                          </div>
                          <div className={`text-[10px] select-none font-sans font-medium ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`}>
                            外資: <span className={(stock.institutionalFlow.foreign ?? 0) >= 0 ? 'text-emerald-500 font-extrabold' : 'text-rose-450 font-extrabold'}>{stock.institutionalFlow.foreign ?? 0}</span> | 
                            投信: <span className={(stock.institutionalFlow.investmentTrust ?? 0) >= 0 ? 'text-emerald-500 font-extrabold' : 'text-rose-450 font-extrabold'}>{stock.institutionalFlow.investmentTrust ?? 0}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className={`font-mono font-extrabold text-sm ${(stock.institutionalFlow.netInstitutionalUSD ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-450'}`}>
                            {(stock.institutionalFlow.netInstitutionalUSD ?? 0) >= 0 ? '+' : ''}{stock.institutionalFlow.netInstitutionalUSD} M USD
                          </div>
                          <span className={`text-[10px] font-sans font-medium ${isDarkMode ? 'text-slate-450' : 'text-slate-500'}`}>機構大單吸籌</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
