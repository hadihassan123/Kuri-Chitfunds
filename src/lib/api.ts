import {
  ChitFund,
  Member,
  DrawResult,
  CreateChitPayload,
  AddMemberPayload,
} from '@/types/chit';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const FASTAPI_TIMEOUT_MS = 20000;
type Raw = Record<string, unknown>;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!supabase) throw new Error('Supabase authentication is not configured');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

function mapMember(raw: Raw): Member {
  return {
    id: raw.id as string,
    name: raw.name as string,
    email: raw.email as string,
    phone: raw.phone as string | undefined,
    country: raw.country as string,
    hasWon: (raw.has_won ?? raw.hasWon) as boolean,
    wonInMonth: (raw.won_in_month ?? raw.wonInMonth) as number | undefined,
  };
}

function mapDraw(raw: Raw): DrawResult {
  return {
    id: raw.id as string,
    month: raw.month as number,
    winnerId: (raw.winner_id ?? raw.winnerId) as string,
    winnerName: (raw.winner_name ?? raw.winnerName) as string,
    drawnAt: (raw.drawn_at ?? raw.drawnAt) as string,
  };
}

function mapChit(raw: Raw): ChitFund {
  return {
    id: raw.id as string,
    name: raw.name as string,
    description: raw.description as string | undefined,
    monthlyAmount: (raw.monthly_amount ?? raw.monthlyAmount) as number,
    currency: raw.currency as string,
    totalMembers: (raw.total_members ?? raw.totalMembers) as number,
    durationMonths: (raw.duration_months ?? raw.durationMonths) as number,
    currentMonth: (raw.current_month ?? raw.currentMonth) as number,
    organizerId: (raw.organizer_id ?? raw.organizerId) as string,
    organizerWinsFirst: (raw.organizer_wins_first ?? raw.organizerWinsFirst) as boolean,
    status: raw.status as 'draft' | 'active' | 'completed',
    createdAt: (raw.created_at ?? raw.createdAt) as string,
    members: Array.isArray(raw.members) ? raw.members.map((m) => mapMember(m as Raw)) : [],
    draws: Array.isArray(raw.draws) ? raw.draws.map((d) => mapDraw(d as Raw)) : [],
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/**
 * Application data access boundary.
 * Supabase is used only for Auth/JWT retrieval; all chit/member/draw/payment
 * reads and writes go through FastAPI.
 */
export const api = {
  async getChits(): Promise<ChitFund[]> {
    const data = await apiFetch<Raw[]>('/api/chits');
    return data.map(mapChit);
  },

  async getChit(id: string): Promise<ChitFund | null> {
    try {
      const data = await apiFetch<Raw>(`/api/chits/${id}`);
      return mapChit(data);
    } catch (error) {
      if (error instanceof Error && error.message === 'Chit fund not found') return null;
      throw error;
    }
  },

  async createChit(payload: CreateChitPayload): Promise<ChitFund> {
    const body = {
      name: payload.name,
      description: payload.description,
      monthly_amount: payload.monthlyAmount,
      currency: payload.currency,
      total_members: payload.totalMembers,
      organizer_name: payload.organizerName,
      organizer_email: payload.organizerEmail,
      organizer_country: payload.organizerCountry,
      organizer_wins_first: payload.organizerWinsFirst,
    };
    const data = await apiFetch<Raw>('/api/chits', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapChit(data);
  },

  async addMember(chitId: string, payload: AddMemberPayload): Promise<Member> {
    const data = await apiFetch<Raw>(`/api/chits/${chitId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapMember(data);
  },

  async removeMember(chitId: string, memberId: string): Promise<void> {
    await apiFetch(`/api/chits/${chitId}/members/${memberId}`, { method: 'DELETE' });
  },

  async getEligibleMembers(chitId: string): Promise<Member[]> {
    const data = await apiFetch<Raw[]>(`/api/chits/${chitId}/eligible`);
    return data.map(mapMember);
  },

  async conductDraw(chitId: string): Promise<DrawResult> {
    const data = await apiFetch<Raw>(`/api/chits/${chitId}/draw`, { method: 'POST' });
    return mapDraw(data);
  },

  async getPayments(chitId: string): Promise<Raw[]> {
    return apiFetch<Raw[]>(`/api/chits/${chitId}/payments`);
  },

  async markPaid(chitId: string, paymentId: string): Promise<Raw> {
    return apiFetch<Raw>(`/api/chits/${chitId}/payments/${paymentId}/mark-paid`, { method: 'PATCH' });
  },

  async markUnpaid(chitId: string, paymentId: string): Promise<Raw> {
    return apiFetch<Raw>(`/api/chits/${chitId}/payments/${paymentId}/mark-unpaid`, { method: 'PATCH' });
  },
};
