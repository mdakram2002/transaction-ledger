import { randomUUID } from "node:crypto";
import { getAccounts } from "../config/database.js";
import type { Account, Pagination } from "../types/models.js";
import { serializeAccount } from "../utils/serializers.js";
import { raiseHttpError } from "../utils/http-error.js";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createAccount(name: string) {
  const account: Account = {
    id: randomUUID(),
    name,
    balance_minor: 0,
    created_at: new Date(),
  };
  await getAccounts().insertOne(account);
  return serializeAccount(account);
}

export async function listAccounts(
  pagination: Pagination,
  search?: string,
) {
  const filter = search ? { name: { $regex: escapeRegex(search), $options: "i" } } : {};
  const [items, total] = await Promise.all([
    getAccounts()
      .find(filter)
      .sort({ created_at: -1, id: 1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .toArray(),
    getAccounts().countDocuments(filter),
  ]);
  return {
    items: items.map(serializeAccount),
    pagination: {
      ...pagination,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getAccount(accountId: string) {
  const account = await getAccounts().findOne({ id: accountId });
  if (!account) raiseHttpError(404, "ACCOUNT_NOT_FOUND", "Account was not found");
  return serializeAccount(account);
}

export async function getAccountBalance(accountId: string) {
  const account = await getAccounts().findOne(
    { id: accountId },
    { projection: { id: 1, balance_minor: 1 } },
  );
  if (!account) raiseHttpError(404, "ACCOUNT_NOT_FOUND", "Account was not found");
  return { account_id: account.id, balance: account.balance_minor / 100 };
}
