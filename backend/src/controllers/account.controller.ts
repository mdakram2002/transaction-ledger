import type { Request, Response } from "express";
import {
  accountListQuerySchema,
  createAccountSchema,
} from "../validators/account.validators.js";
import {
  createAccount,
  getAccount,
  getAccountBalance,
  listAccounts,
} from "../services/account.service.js";

export async function createAccountController(req: Request, res: Response) {
  const body = createAccountSchema.parse(req.body);
  const account = await createAccount(body.name);
  res.status(201).json({ success: true, data: account });
}

export async function listAccountsController(req: Request, res: Response) {
  const query = accountListQuerySchema.parse(req.query);
  const result = await listAccounts(query, query.search);
  res.json({ success: true, data: result });
}

export async function getAccountController(req: Request, res: Response) {
  const account = await getAccount(String(req.params.accountId));
  res.json({ success: true, data: account });
}

export async function getAccountBalanceController(req: Request, res: Response) {
  const balance = await getAccountBalance(String(req.params.accountId));
  res.json({ success: true, data: balance });
}
