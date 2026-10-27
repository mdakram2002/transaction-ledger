import type { Request, Response } from "express";
import {
  assertAccountExists,
  createTransaction,
  getTransaction,
  listTransactions,
} from "../services/transaction.service.js";
import { transactionListQuerySchema } from "../validators/transaction.validators.js";
import { createTransactionSchema } from "../validators/transaction.validators.js";

export async function createTransactionController(req: Request, res: Response) {
  const body = createTransactionSchema.parse(req.body);
  const transaction = await createTransaction(
    String(req.params.accountId),
    body,
  );
  res.status(201).json({ success: true, data: transaction });
}

export async function listAccountTransactionsController(
  req: Request,
  res: Response,
) {
  const query = transactionListQuerySchema.parse(req.query);
  const accountId = String(req.params.accountId);
  await assertAccountExists(accountId);
  const result = await listTransactions(query, {
    accountId,
    type: query.type,
  });
  res.json({ success: true, data: result });
}

export async function listAllTransactionsController(
  req: Request,
  res: Response,
) {
  const query = transactionListQuerySchema.parse(req.query);
  const result = await listTransactions(query, { type: query.type });
  res.json({ success: true, data: result });
}

export async function getTransactionController(req: Request, res: Response) {
  const transaction = await getTransaction(
    String(req.params.accountId),
    String(req.params.transactionId),
  );
  res.json({ success: true, data: transaction });
}
