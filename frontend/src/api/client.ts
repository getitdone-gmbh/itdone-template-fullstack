// API URL: Use environment variable, or derive from window location
function getApiBase(): string {
  // Build-time env var (Vite)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Runtime: Replace 'frontend' with 'backend' in hostname
  if (typeof window !== 'undefined' && window.location.hostname.includes('frontend')) {
    const backendHost = window.location.hostname.replace('frontend', 'backend');
    return `${window.location.protocol}//${backendHost}/api`;
  }

  // Local development fallback
  return '/api';
}

const API_BASE = getApiBase();

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  transactions?: Transaction[];
  quote?: StockQuote;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  user?: User;
  positions: Position[];
  summary?: {
    totalValue: number;
    totalCostBasis: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    positionCount: number;
  };
}

export interface Transaction {
  id: string;
  positionId: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: string;
  position?: { symbol: string };
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export const api = {
  // Portfolios
  getPortfolios: () => request<Portfolio[]>('/portfolios'),

  getPortfolio: (id: string) => request<Portfolio>(`/portfolios/${id}`),

  createPortfolio: (name: string) =>
    request<Portfolio>('/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  deletePortfolio: (id: string) =>
    request<{ message: string }>(`/portfolios/${id}`, {
      method: 'DELETE',
    }),

  // Trading
  buyStock: (portfolioId: string, data: { symbol: string; shares: number; price: number; date?: string }) =>
    request<{ position: Position; transaction: Transaction }>(`/portfolios/${portfolioId}/buy`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sellStock: (portfolioId: string, data: { symbol: string; shares: number; price: number; date?: string }) =>
    request<{ position: Position | null; transaction: Transaction }>(`/portfolios/${portfolioId}/sell`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Transactions
  getTransactions: (portfolioId: string) =>
    request<(Transaction & { position: { symbol: string } })[]>(`/portfolios/${portfolioId}/transactions`),

  // Stock Quotes
  getStockQuote: (symbol: string) => request<StockQuote>(`/stocks/${symbol}/quote`),
};
