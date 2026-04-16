// src/types/transaction.ts
export type Currency = "USD" | "IDR";
export type TransactionType = "income" | "expense";

/**
 * Sesuai backend response (contoh Postman):
 * {
 *   id, userId, type, amountCents, currency, category,
 *   isDialysisRelated, date (YYYY-MM-DD),
 *   note, createdAt, updatedAt
 * }
 */
export type Transaction = {
  id: string;
  userId?: string;

  type: TransactionType;

  amountCents: number;
  currency: Currency;

  category: string;

  // backend: boolean
  isDialysisRelated: boolean;

  // backend: "YYYY-MM-DD"
  date: string;

  note?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export type ListTransactionsMeta = {
  nextCursor?: string | null;
  limit: number;
};

export type ListTransactionsResponse = {
  success: true;
  data: Transaction[];
  meta: ListTransactionsMeta;
};

export type SingleTransactionResponse = {
  success: true;
  data: Transaction;
};

export type DeleteTransactionResponse = {
  success: true;
};

/** Error format umum dari backend */
export type ApiErrorShape = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};