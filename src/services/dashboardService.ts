// src/services/dashboardService.ts
import type { Transaction } from "../types/transaction";

const RAW_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.trim() ||
  "http://localhost:5014/api/v1";

function normalizeBase(raw: string) {
  return raw.replace(/\/+$/, "");
}

/**
 * Build absolute URL safely.
 * - If base is absolute (http/https): use it
 * - If base is relative (/api/v1): prepend window.location.origin
 */
function buildAbsoluteBase(base: string) {
  const b = normalizeBase(base);
  if (/^https?:\/\//i.test(b)) return b;

  const origin = window.location.origin;
  if (!b) return origin;
  if (b.startsWith("/")) return `${origin}${b}`;
  return `${origin}/${b}`;
}

const BASE_URL = buildAbsoluteBase(RAW_BASE);

type ListTxMeta = {
  nextCursor?: string | null;
  limit?: number;
};

type ListTxResponse = {
  success: boolean;
  data: Transaction[];
  meta?: ListTxMeta;
};

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${BASE_URL}${p}`);

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }

  return url.toString();
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function daysAgoYmd(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toYmd(d);
}

function todayYmd() {
  return toYmd(new Date());
}

async function request<T>(opts: {
  path: string;
  token: string;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}): Promise<T> {
  const url = buildUrl(opts.path, opts.query);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.token}`,
    },
    signal: opts.signal,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // backend kamu biasanya { success:false, error:{ message } }
    const message = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

/**
 * Ambil transaksi 60 hari terakhir (default), minimal request:
 * - 1 request utama (limit max 100 sesuai backend)
 * - jika masih ada nextCursor, fetch 1 page tambahan (opsional) sebagai safety
 */
export async function fetchRecentTransactionsRange(args: {
  token: string;
  daysBack?: number; // default 60
  limit?: number; // default 100 (max allowed by backend)
  signal?: AbortSignal;
}): Promise<Transaction[]> {
  const daysBack = args.daysBack ?? 60;

  // ✅ backend max 100
  const limit = Math.min(args.limit ?? 100, 100);

  const from = daysAgoYmd(daysBack);
  const to = todayYmd();

  const first = await request<ListTxResponse>({
    path: "/transactions",
    token: args.token,
    query: { from, to, limit },
    signal: args.signal,
  });

  const data1 = first.data ?? [];
  const cursor1 = first.meta?.nextCursor ?? null;

  if (!cursor1) return data1;

  const second = await request<ListTxResponse>({
    path: "/transactions",
    token: args.token,
    query: { from, to, limit, cursor: cursor1 },
    signal: args.signal,
  });

  const data2 = second.data ?? [];

  // dedupe by id (safety)
  const seen = new Set<string>();
  const merged: Transaction[] = [];
  for (const t of [...data1, ...data2]) {
    if (!t?.id) continue;
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    merged.push(t);
  }

  return merged;
}