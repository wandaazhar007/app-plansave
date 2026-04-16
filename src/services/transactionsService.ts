// src/services/transactionsService.ts
import type {
  DeleteTransactionResponse,
  ListTransactionsResponse,
  SingleTransactionResponse,
  Transaction,
} from "../types/transaction";
import { ensureDelay } from "../lib/utils/ensureDelay";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// skeleton sengaja agak lama biar smooth
const MIN_SKELETON_MS = 650;

function buildUrl(path: string) {
  // BASE bisa absolute atau relative (mis. /api/v1)
  // kalau relative, pakai origin agar jadi URL valid
  if (/^https?:\/\//i.test(BASE)) {
    return `${BASE.replace(/\/+$/, "")}${path}`;
  }
  return new URL(`${BASE}${path}`, window.location.origin).toString();
}

async function request<T>(path: string, options: RequestInit & { token: string }): Promise<T> {
  const { token, ...rest } = options;

  const res = await fetch(buildUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(rest.headers || {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // backend biasanya: { success:false, error:{message} } atau { message }
    const message = json?.error?.message || json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

export async function listTransactions(args: {
  token: string;
  limit: number; // backend max 100
  cursor?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  // masih kita simpan agar kompatibel kalau nanti dipakai lagi
  type?: string;
  category?: string;
  dialysis?: string;
}): Promise<ListTransactionsResponse> {
  const start = Date.now();

  const params = new URLSearchParams();
  params.set("limit", String(args.limit));
  if (args.cursor) params.set("cursor", args.cursor);
  if (args.from) params.set("from", args.from);
  if (args.to) params.set("to", args.to);
  if (args.type) params.set("type", args.type);
  if (args.category) params.set("category", args.category);
  if (args.dialysis) params.set("dialysis", args.dialysis);

  const p = request<ListTransactionsResponse>(`/transactions?${params.toString()}`, {
    method: "GET",
    token: args.token,
  });

  const result = await p;
  await ensureDelay(start, MIN_SKELETON_MS);
  return result;
}

export async function createTransaction(args: { token: string; payload: Partial<Transaction> }) {
  return request<SingleTransactionResponse>(`/transactions`, {
    method: "POST",
    token: args.token,
    body: JSON.stringify(args.payload),
  });
}

export async function updateTransaction(args: {
  token: string;
  id: string;
  payload: Partial<Transaction>;
}) {
  return request<SingleTransactionResponse>(`/transactions/${args.id}`, {
    method: "PUT",
    token: args.token,
    body: JSON.stringify(args.payload),
  });
}

export async function deleteTransaction(args: { token: string; id: string }) {
  return request<DeleteTransactionResponse>(`/transactions/${args.id}`, {
    method: "DELETE",
    token: args.token,
  });
}