export interface Account {
  id: string;
  name: string;
  balance_minor: number;
  created_at: Date;
}

export interface LedgerTransaction {
  id: string;
  account_id: string;
  type: "credit" | "debit";
  amount_minor: number;
  description: string;
  reference_id: string;
  created_at: Date;
}

export interface Pagination {
  page: number;
  limit: number;
}
