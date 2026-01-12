// src/services/transactionsService.ts
import { apiRequest } from "./apiClient";
import type {
  Transaction,
  TransactionsListMeta,
  TransactionCreateInput,
  TransactionUpdateInput,
} from "../types/transaction";

export async function listTransactions(params: {
  from?: string;
  to?: string;
  type?: "income" | "expense";
  category?: string;
  dialysis?: boolean;
  limit?: number;
  cursor?: string | null;
  signal?: AbortSignal;
  minDelayMs?: number;
}) {
  return apiRequest<Transaction[], TransactionsListMeta>({
    path: "/transactions",
    method: "GET",
    query: {
      from: params.from,
      to: params.to,
      type: params.type,
      category: params.category,
      dialysis: params.dialysis,
      limit: params.limit ?? 20,
      cursor: params.cursor ?? undefined,
    },
    signal: params.signal,
    minDelayMs: params.minDelayMs,
  });
}

export async function createTransaction(input: TransactionCreateInput) {
  return apiRequest<Transaction>({
    path: "/transactions",
    method: "POST",
    body: input,
  });
}

export async function updateTransaction(id: string, input: TransactionUpdateInput) {
  return apiRequest<Transaction>({
    path: `/transactions/${id}`,
    method: "PUT",
    body: input,
  });
}

export async function deleteTransaction(id: string) {
  return apiRequest<{ deleted: boolean }>({
    path: `/transactions/${id}`,
    method: "DELETE",
  });
}