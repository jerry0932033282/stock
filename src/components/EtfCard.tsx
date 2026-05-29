/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Etf } from '../types.ts';
import { TrendingUp, TrendingDown, Layers, Award, BarChart3, ExternalLink } from 'lucide-react';
import { getGoogleFinanceUrl, getTrendTextColor, getTrendBgColor, formatVolume } from '../utils.ts';

interface EtfCardProps {
  etf: Etf;
  isDarkMode?: boolean;
  key?: React.Key;
}

export default function EtfCard({ etf, isDarkMode = false }: EtfCardProps) {
  const isUp = etf.change >= 0;

  return (
    <div 
      className={`border rounded-2xl p-5 flex flex-col justify-between transition duration-200 ${
        isDarkMode 
          ? 'bg-[#111827] border-slate-800 text-white hover:border-[#00F0FF]/55 hover:shadow-[0_0_15px_rgba(0,240,255,0.08)]' 
          : 'bg-white border-slate-200 hover:border-blue-303 hover:shadow-md'
      }`}
      id={`etf-card-${etf.id}`}
    >
      <div>
        {/* Card Header & Price info */}
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0">
            <a 
              href={getGoogleFinanceUrl(etf.symbol)} 
              target="_blank" 
              rel="noreferrer"
              className="group"
            >
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono border transition ${
                isDarkMode 
                  ? 'bg-slate-800/80 text-[#00F0FF] border-slate-700/60 group-hover:bg-slate-700' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:text-blue-600'
              }`}>
                {etf.id} | {etf.symbol}
                <ExternalLink size={10} className="opacity-60" />
              </span>
              <h4 className={`text-lg font-bold mt-1.5 truncate tracking-tight transition font-sans ${
                isDarkMode ? 'text-white group-hover:text-[#00F0FF]' : 'text-slate-900 group-hover:text-blue-600'
              }`}>
                {etf.name}
              </h4>
            </a>
            <div className={`text-xs mt-1 flex items-center gap-1.5 font-sans ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="font-semibold">AI 權重佔比:</span>
              <strong className={`font-extrabold font-mono text-xs ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>{etf.aiPurity}</strong>
            </div>
          </div>


          <div className="text-right shrink-0 font-sans">
            <div className={`text-lg font-mono font-extrabold ${isDarkMode ? 'text-[#00F0FF]' : 'text-slate-900'}`}>
              ${etf.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex justify-end">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold border ${getTrendBgColor(etf.change, etf.symbol)}`}>
                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{isUp ? '+' : ''}{etf.changePercent.toFixed(2)}%</span>
                <span className="opacity-90">({isUp ? '+' : ''}{etf.change.toFixed(2)})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Technical Summary Bar */}
        <div className={`grid grid-cols-2 gap-2 mt-4 text-xs p-3 rounded-xl border font-mono ${
          isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="space-y-0.5">
            <span className={`block text-[10px] tracking-wide uppercase font-sans font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>今日成交量</span>
            <span className={`font-bold flex items-center gap-1.5 font-mono ${getTrendTextColor(etf.change, etf.symbol)}`}>
              <BarChart3 size={12} className={isDarkMode ? 'text-[#00F0FF]' : 'text-blue-500'} />
              {formatVolume(etf.volume, etf.symbol)}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className={`block text-[10px] tracking-wide uppercase font-sans font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>均線多頭狀態</span>
            <span className={`font-bold flex items-center gap-1 ${
              etf.maStrength === 3 
                ? (isDarkMode ? 'text-rose-450' : 'text-rose-600') 
                : (isDarkMode ? 'text-amber-400' : 'text-amber-600')
            }`}>
              <Award size={12} />
              強度 {etf.maStrength} ({etf.maStrength === 3 ? '完美多頭' : '中長多頭'})
            </span>
          </div>
        </div>

        {/* Expert narrative description */}
        <p className={`text-xs mt-4 leading-relaxed p-3.5 rounded-xl border font-medium font-sans ${
          isDarkMode ? 'bg-[#1E293B]/40 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'
        }`}>
          {etf.description}
        </p>

        {/* Core Holdings (weights grid) */}
        <div className="mt-5">
          <span className={`text-xs block font-bold mb-2.5 flex items-center gap-1.5 font-sans ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Layers size={13} className={isDarkMode ? 'text-[#00F0FF]' : 'text-blue-500'} />
            前四大權重成分股配置:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {etf.topHoldings.map((hold, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl border flex justify-between items-center text-xs shadow-sm font-sans ${
                  isDarkMode ? 'bg-[#1E293B]/30 border-slate-805/70 text-slate-200' : 'bg-white border-slate-200'
                }`}
              >
                <span className={`truncate font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{hold.name}</span>
                <span className={`font-extrabold font-mono shrink-0 ml-1.5 ${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'}`}>{hold.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
