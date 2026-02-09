// // src/types/transaction.ts
// export type Currency = "USD" | "IDR";
// export type TransactionType = "income" | "expense";

// export type Transaction = {
//   id: string;
//   userId: string;
//   type: TransactionType;
//   amountCents: number;
//   currency: Currency; // default USD (backend)
//   category: string;
//   isDialysisRelated: boolean;
//   date: string; // YYYY-MM-DD
//   note?: string | null;
//   createdAt: string;
//   updatedAt: string;
// };

// export type TransactionsListMeta = {
//   nextCursor: string | null;
//   limit: number;
// };

// export type TransactionCreateInput = {
//   type: TransactionType;
//   amountCents: number;
//   currency?: Currency; // optional, default USD
//   category: string;
//   isDialysisRelated: boolean;
//   date: string; // YYYY-MM-DD
//   note?: string;
// };

// export type TransactionUpdateInput = Partial<TransactionCreateInput>;



export type TransactionType = "income" | "expense";

export type Transaction = {
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