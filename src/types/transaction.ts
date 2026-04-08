export type TransactionType = "income" | "expense";

export type Transaction = {
  // amountCents(amountCents: any): number;
  amountCents: number;
  isDialysisRelated: any;
  id: string;
  type: TransactionType;
  amount: number;
  currency?: "USD" | "IDR";
  date: string; // ISO
  category: string;
  note?: string | null;
  isDialysis?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ListTransactionsResponse = {
  success: boolean;
  data: Transaction[];
  nextCursor?: string | null;
};

export type ApiFail = {
  success: false;
  code?: string;
  message?: string;
  details?: any;
};