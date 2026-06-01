/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { NEWS_AND_REPORTS } from '../data.ts';
import { NewsAndReportsItem } from '../types.ts';
import { Calendar, Building, Sparkles, Lightbulb, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { getBeneficiaryUrl } from '../utils.ts';

interface NewsSectionProps {
  isDarkMode?: boolean;
}

export default function NewsSection({ isDarkMode = false }: NewsSectionProps) {
  const [newsFilter, setNewsFilter] = useState<'all' | 'news' | 'report'>('all');
  const [selectedNews, setSelectedNews] = useState<NewsAndReportsItem>(NEWS_AND_REPORTS[0]);

  // Filtered news list based on buttons
  const filteredNews = useMemo(() => {
    if (newsFilter === 'all') return NEWS_AND_REPORTS;
    return NEWS_AND_REPORTS.filter(item => item.type === newsFilter);
  }, [newsFilter]);

  // Automatically select first element if current selected element doesn't exist in filtered
  React.useEffect(() => {
    if (filteredNews.length > 0 && !filteredNews.includes(selectedNews)) {
      setSelectedNews(filteredNews[0]);
    }
  }, [filteredNews, selectedNews]);

  const handleNewsClick = (item: NewsAndReportsItem) => {
    setSelectedNews(item);
    // Smooth scroll down to the deep analysis pane on mobile
    const detailPane = document.getElementById('deep-analysis-pane');
    if (detailPane && window.innerWidth < 1024) {
      detailPane.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* 1. LEFT/MIDDLE COLUMN: MULTI-CHANNEL NEWS FEED */}
      <div className="lg:col-span-2 space-y-4">
        {/* Dynamic header and filter */}
        <div className={`border rounded-2xl p-4 md:p-5 shadow-sm ${
          isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base md:text-lg font-extrabold flex items-center gap-2">
                <Sparkles size={16} className={`${isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'} animate-pulse animate-duration-1000`} />
                AI 產業供應鏈情報與核心研報
              </h3>
              <p className={`text-[11px] md:text-xs mt-1 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                整合 CoWoS 封裝設備、水冷散熱模組、ASIC 及太空通信大數據深度 analysis
              </p>
            </div>
            
            {/* Category selection */}
            <div className={`flex rounded-xl p-1 border text-xs self-start sm:self-auto shrink-0 shadow-inner ${
              isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button 
                onClick={() => setNewsFilter('all')}
                className={`px-3 py-2 rounded-lg transition duration-150 font-bold cursor-pointer ${
                  newsFilter === 'all' 
                    ? (isDarkMode ? 'bg-slate-800 text-[#00F0FF] border border-slate-705/50 shadow-sm' : 'bg-white text-red-650 shadow-sm border border-slate-200/50') 
                    : (isDarkMode ? 'text-slate-400 hover:text-[#00F0FF]' : 'text-slate-550 hover:text-red-600')
                }`}
              >
                全部資訊
              </button>
              <button 
                onClick={() => setNewsFilter('news')}
                className={`px-3 py-2 rounded-lg transition duration-150 font-bold cursor-pointer ${
                  newsFilter === 'news' 
                    ? (isDarkMode ? 'bg-slate-800 text-[#00F0FF] border border-slate-705/50 shadow-sm' : 'bg-white text-red-650 shadow-sm border border-slate-200/50') 
                    : (isDarkMode ? 'text-slate-400 hover:text-[#00F0FF]' : 'text-slate-550 hover:text-red-650')
                }`}
              >
                即時新聞
              </button>
              <button 
                onClick={() => setNewsFilter('report')}
                className={`px-3 py-2 rounded-lg transition duration-150 font-bold cursor-pointer ${
                  newsFilter === 'report' 
                    ? (isDarkMode ? 'bg-slate-800 text-[#00F0FF] border border-slate-705/50 shadow-sm' : 'bg-white text-red-650 shadow-sm border border-slate-200/50') 
                    : (isDarkMode ? 'text-slate-400 hover:text-[#00F0FF]' : 'text-slate-550 hover:text-red-650')
                }`}
              >
                法人研報
              </button>
            </div>
          </div>
        </div>

        {/* List of elements */}
        <div className="space-y-4">
          {filteredNews.map((item) => {
            const isSelected = selectedNews?.id === item.id;
            const isNews = item.type === 'news';

            return (
              <div 
                key={item.id}
                onClick={() => handleNewsClick(item)}
                className={`p-5 rounded-2xl border transition duration-150 cursor-pointer text-left shadow-sm ${
                  isSelected 
                    ? (isDarkMode ? 'bg-[#1E293B]/60 border-[#00F0FF]/80 shadow-[0_0_15px_rgba(0,240,255,0.06)] ring-2 ring-[#00F0FF]/20' : 'bg-blue-50/75 border-blue-500/60 shadow-md ring-2 ring-blue-500/20') 
                    : (isDarkMode ? 'bg-[#111827] border-slate-800 hover:border-slate-700 hover:bg-[#1E293B]/20' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40')
                }`}
                id={`news-item-${item.id}`}
              >
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-sans select-none ${
                      isNews 
                        ? (isDarkMode ? 'bg-cyan-950/40 text-[#00F0FF] border border-cyan-500/30' : 'bg-blue-50 text-blue-700 border border-blue-105') 
                        : (isDarkMode ? 'bg-indigo-950/40 text-violet-300 border border-violet-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-105')
                    }`}>
                      {isNews ? '即時新聞' : '法人研報'}
                    </span>
                    <span className={`font-mono font-bold flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Calendar size={11} />
                      {item.date}
                    </span>
                    <span className={`font-semibold flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>
                      <Building size={11} />
                      {item.source}
                    </span>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                    item.impact === 'High' 
                      ? (isDarkMode ? 'bg-rose-950/30 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-700 border-rose-100') 
                      : (isDarkMode ? 'bg-slate-800 text-slate-350 border-slate-700' : 'bg-slate-100 text-slate-650 border-slate-200')
                  }`}>
                    強度: {item.impact === 'High' ? '極高' : '高'}
                  </span>
                </div>

                {/* Title */}
                <h4 className={`text-base md:text-lg font-extrabold leading-snug transition duration-150 ${
                  isSelected 
                    ? (isDarkMode ? 'text-[#00F0FF]' : 'text-blue-750') 
                    : (isDarkMode ? 'text-white' : 'text-slate-900')
                }`}>
                  {item.title}
                </h4>

                {/* Summary */}
                <p className={`text-xs md:text-sm mt-2.5 line-clamp-2 leading-relaxed font-semibold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {item.summary}
                </p>

                {/* Optional rating banner */}
                {item.rating && (
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>機構投資評等:</span>
                    <span className={`font-extrabold px-2 py-0.5 rounded border font-mono ${
                      isDarkMode ? 'bg-rose-950/30 text-rose-450 border-rose-900/50' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {item.rating}
                    </span>
                  </div>
                )}

                {/* Key stocks targets */}
                <div className={`mt-4 pt-3 border-t flex flex-wrap items-center gap-2 ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-150'
                }`}>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">關聯佈局標的:</span>
                  {item.beneficiaries.map((b, idx) => (
                    <a 
                      key={idx} 
                      href={getBeneficiaryUrl(b)}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-mono text-[10px] border font-bold transition-all duration-150 ${
                        isDarkMode 
                          ? 'bg-slate-800 text-[#00F0FF] border-slate-700/60 hover:bg-slate-755 hover:border-[#00F0FF]' 
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'
                      }`}
                    >
                      <span>{b}</span>
                      <ExternalLink size={9} className="opacity-70" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: DEEP ANALYST INSIGHT (Sticky Terminal Container) */}
      <div className="lg:col-span-1" id="deep-analysis-pane">
        <div className={`border rounded-2xl p-6 lg:sticky lg:top-8 space-y-6 shadow-sm ${
          isDarkMode ? 'bg-[#111827] border-slate-805 text-white shadow-md' : 'bg-white border-slate-205 text-slate-900 shadow-sm'
        }`}>
          <h3 className={`text-base font-bold pb-3 border-b flex items-center gap-2 ${
            isDarkMode ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <Lightbulb className={isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'} size={18} />
            情報深度解讀 (Deep Intelligence)
          </h3>

          {selectedNews ? (
            <div className="space-y-4">
              <div>
                <span className={`text-[10px] px-2 py-0.5 border rounded-full font-mono font-extrabold tracking-widest uppercase ${
                  isDarkMode ? 'bg-cyan-950/50 text-[#00F0FF] border-cyan-500/20' : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}>
                  {selectedNews.category}
                </span>
                <h4 className="text-lg font-bold mt-2 leading-snug tracking-tight">
                  {selectedNews.title}
                </h4>
                <div className={`flex items-center space-x-2.5 mt-2.5 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="font-semibold">{selectedNews.source}</span>
                  <span>•</span>
                  <span className="font-mono">{selectedNews.date}</span>
                </div>
              </div>

              {/* Narratives details */}
              <div className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#0f172a] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-705'
              }`}>
                <span className={`text-xs font-extrabold flex items-center gap-1.5 mb-2 ${
                  isDarkMode ? 'text-[#00F0FF]' : 'text-blue-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? 'bg-[#00F0FF]' : 'bg-blue-500'}`}></span>
                  分析師深度觀點
                </span>
                <p className="text-xs md:text-sm leading-relaxed font-semibold">
                  {selectedNews.detailText}
                </p>
              </div>

              {/* Beneficiary quick trading anchors */}
              <div className={`pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-150'}`}>
                <span className={`text-xs block font-bold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  優先佈局核心標的：
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNews.beneficiaries.map((b, i) => (
                    <a 
                      key={i} 
                      href={getBeneficiaryUrl(b)}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border transition ${
                        isDarkMode 
                          ? 'bg-cyan-950/20 text-[#00F0FF] border-cyan-500/20 hover:border-[#00F0FF]/50 hover:bg-cyan-900/30' 
                          : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50 hover:border-blue-300'
                      }`}
                    >
                      <span>{b}</span>
                      <ExternalLink size={10} className="opacity-70" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 text-xs flex flex-col items-center gap-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <AlertTriangle size={24} className="text-slate-400 mb-2" />
              <span>請點選左側新聞或法人研報以載入深度大數據分析。</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
