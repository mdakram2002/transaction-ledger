import type { Account, LedgerTransaction } from "../types/models.js";

export function serializeAccount(account: Account) {
  return {
    id: account.id,
    name: account.name,
    balance: account.balance_minor / 100,
    created_at: account.created_at.toISOString(),
  };
}

export function serializeTransaction(transaction: LedgerTransaction) {
  return {
    id: transaction.id,
    account_id: transaction.account_id,
    type: transaction.type,
    amount: transaction.amount_minor / 100,
    description: transaction.description,
    reference_id: transaction.reference_id,
    created_at: transaction.created_at.toISOString(),
  };
}
