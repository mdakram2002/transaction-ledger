import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000",
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});
export interface Account {
  id: string;
  name: string;
  balance: number;
  created_at: string;
}
export interface Txn {
  id: string;
  account_id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  reference_id: string;
  created_at: string;
}
export interface Page<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}
export function errorMessage(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data?.error?.message ??
        "The API could not be reached. Check your connection and try again.")
    : "Something went wrong. Please try again.";
}
