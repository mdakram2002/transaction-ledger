import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler.js";
import { writeRateLimit } from "../middleware/write-rate-limit.js";
import {
  createAccountController,
  getAccountBalanceController,
  getAccountController,
  listAccountsController,
} from "../controllers/account.controller.js";
import {
  createTransactionController,
  getTransactionController,
  listAccountTransactionsController,
} from "../controllers/transaction.controller.js";

export const accountRouter = Router();

accountRouter.post("/", writeRateLimit, asyncHandler(createAccountController));
accountRouter.get("/", asyncHandler(listAccountsController));
accountRouter.get("/:accountId", asyncHandler(getAccountController));
accountRouter.get(
  "/:accountId/balance",
  asyncHandler(getAccountBalanceController),
);
accountRouter.post(
  "/:accountId/transactions",
  writeRateLimit,
  asyncHandler(createTransactionController),
);
accountRouter.get(
  "/:accountId/transactions",
  asyncHandler(listAccountTransactionsController),
);
accountRouter.get(
  "/:accountId/transactions/:transactionId",
  asyncHandler(getTransactionController),
);
