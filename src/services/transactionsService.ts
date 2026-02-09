// // src/services/transactionsService.ts
// import { apiRequest } from "./apiClient";
// import type {
//   Transaction,
//   TransactionsListMeta,
//   TransactionCreateInput,
//   TransactionUpdateInput,
// } from "../types/transaction";

// export async function listTransactions(params: {
//   from?: string;
//   to?: string;
//   type?: "income" | "expense";
//   category?: string;
//   dialysis?: boolean;
//   limit?: number;
//   cursor?: string | null;
//   signal?: AbortSignal;
//   minDelayMs?: number;
// }) {
//   return apiRequest<Transaction[], TransactionsListMeta>({
//     path: "/transactions",
//     method: "GET",
//     query: {
//       from: params.from,
//       to: params.to,
//       type: params.type,
//       category: params.category,
//       dialysis: params.dialysis,
//       limit: params.limit ?? 20,
//       cursor: params.cursor ?? undefined,
//     },
//     signal: params.signal,
//     minDelayMs: params.minDelayMs,
//   });
// }

// export async function createTransaction(input: TransactionCreateInput) {
//   return apiRequest<Transaction>({
//     path: "/transactions",
//     method: "POST",
//     body: input,
//   });
// }

// export async function updateTransaction(id: string, input: TransactionUpdateInput) {
//   return apiRequest<Transaction>({
//     path: `/transactions/${id}`,
//     method: "PUT",
//     body: input,
//   });
// }

// export async function deleteTransaction(id: string) {
//   return apiRequest<{ deleted: boolean }>({
//     path: `/transactions/${id}`,
//     method: "DELETE",
//   });
// }



import type { ListTransactionsResponse, Transaction } from "../types/transaction";
import { ensureDelay } from "../lib/utils/ensureDelay";

const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// skeleton sengaja agak lama biar smooth
const MIN_SKELETON_MS = 650;

function buildUrl(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options: RequestInit & { token: string }
): Promise<T> {
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
    const message =
      json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

export async function listTransactions(args: {
  token: string;
  limit: number;
  cursor?: string;
  from?: string;
  to?: string;
  type?: string;
  category?: string;
  dialysis?: string;
}): Promise<ListTransactionsResponse> {
  const start = Date.now();

  const params: Record<string, string | undefined> = {
    limit: String(args.limit),
    cursor: args.cursor,
    from: args.from,
    to: args.to,
    type: args.type,
    category: args.category,
    dialysis: args.dialysis,
  };

  const p = request<ListTransactionsResponse>(`/transactions?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as any).toString()}`, {
    method: "GET",
    token: args.token,
  });

  const result = await p;
  await ensureDelay(start, MIN_SKELETON_MS);
  return result;
}

export async function createTransaction(args: {
  token: string;
  payload: Partial<Transaction>;
}) {
  return request<{ success: boolean; data: Transaction }>(`/transactions`, {
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
  return request<{ success: boolean; data: Transaction }>(
    `/transactions/${args.id}`,
    {
      method: "PUT",
      token: args.token,
      body: JSON.stringify(args.payload),
    }
  );
}

export async function deleteTransaction(args: { token: string; id: string }) {
  return request<{ success: boolean }>(`/transactions/${args.id}`, {
    method: "DELETE",
    token: args.token,
  });
}