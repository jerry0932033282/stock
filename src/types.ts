/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InstitutionalFlow {
  foreign?: number;
  investmentTrust?: number;
  proprietary?: number;
  netInstitutionalUSD?: number;
}

export interface Stock {
  id: string;
  name: string;
  symbol: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  revGrowthYoY: number;
  revGrowthMoM: number;
  maStrength: number;
  maDescription: string;
  volumeUp: boolean;
  institutionalFlow: InstitutionalFlow;
}

export interface EtfHolding {
  name: string;
  weight: number;
}

export interface Etf {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  aiPurity: string;
  topHoldings: EtfHolding[];
  maStrength: number;
  description: string;
}

export interface TargetPrice {
  name: string;
  tp: string;
}

export interface NewsAndReportsItem {
  id: string;
  type: string; // 'news' | 'report'
  category: string;
  title: string;
  date: string;
  source: string;
  impact: string; // 'High' | 'Medium'
  summary: string;
  beneficiaries: string[];
  detailText: string;
  rating?: string;
  targetPrices?: TargetPrice[];
}
