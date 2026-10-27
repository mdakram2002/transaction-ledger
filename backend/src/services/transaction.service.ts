import { randomUUID } from "node:crypto";
import { getAccounts, getMongoClient, getTransactions } from "../config/database.js";
import type { LedgerTransaction, Pagination } from "../types/models.js";
import { raiseHttpError } from "../utils/http-error.js";
import { serializeTransaction } from "../utils/serializers.js";

function toMinorUnits(amount: number) {
  const amountMinor = Math.round(amount * 100);
  if (
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0 ||
    Math.abs(amount * 100 - amountMinor) > 1e-7
  ) {
    raiseHttpError(
      400,
      "INVALID_AMOUNT",
      "Amount must be a positive value with at most two decimal places",
    );
  }
  return amountMinor;
}

export async function createTransaction(
  accountId: string,
  input: {
    type: "credit" | "debit";
    amount: number;
    description: string;
    reference_id: string;
  },
) {
  const amountMinor = toMinorUnits(input.amount);
  const transaction: LedgerTransaction = {
    id: randomUUID(),
    account_id: accountId,
    type: input.type,
    amount_minor: amountMinor,
    description: input.description,
    reference_id: input.reference_id,
    created_at: new Date(),
  };
  const session = getMongoClient().startSession();

  try {
    await session.withTransaction(async () => {
      const existing = await getTransactions().findOne(
        { account_id: accountId, reference_id: input.reference_id },
        { session },
      );
      if (existing) {
        raiseHttpError(
          409,
          "DUPLICATE_TRANSACTION",
          "This reference has already been used for this account",
        );
      }

      const filter =
        input.type === "debit"
          ? { id: accountId, balance_minor: { $gte: amountMinor } }
          : { id: accountId };
      const change = input.type === "credit" ? amountMinor : -amountMinor;
      const result = await getAccounts().updateOne(
        filter,
        { $inc: { balance_minor: change } },
        { session },
      );

      if (!result.matchedCount) {
        const exists = await getAccounts().findOne(
          { id: accountId },
          { session, projection: { id: 1 } },
        );
        if (!exists) {
          raiseHttpError(404, "ACCOUNT_NOT_FOUND", "Account was not found");
        }
        raiseHttpError(
          409,
          "INSUFFICIENT_FUNDS",
          "The account has insufficient funds for this debit",
        );
      }

      await getTransactions().insertOne(transaction, { session });
    }, { maxCommitTimeMS: 5000 });

    return serializeTransaction(transaction);
  } finally {
    await session.endSession();
  }
}

export async function listTransactions(
  pagination: Pagination,
  options: { accountId?: string; type?: "credit" | "debit" } = {},
) {
  const filter: Record<string, unknown> = {};
  if (options.accountId) filter.account_id = options.accountId;
  if (options.type) filter.type = options.type;
  const [items, total] = await Promise.all([
    getTransactions()
      .find(filter)
      .sort({ created_at: -1, id: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .toArray(),
    getTransactions().countDocuments(filter),
  ]);
  return {
    items: items.map(serializeTransaction),
    pagination: {
      ...pagination,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getTransaction(accountId: string, transactionId: string) {
  const transaction = await getTransactions().findOne({
    id: transactionId,
    account_id: accountId,
  });
  if (!transaction) {
    raiseHttpError(404, "TRANSACTION_NOT_FOUND", "Transaction was not found");
  }
  return serializeTransaction(transaction);
}

export async function assertAccountExists(accountId: string) {
  const account = await getAccounts().findOne(
    { id: accountId },
    { projection: { id: 1 } },
  );
  if (!account) raiseHttpError(404, "ACCOUNT_NOT_FOUND", "Account was not found");
}
