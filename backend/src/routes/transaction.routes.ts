import { Router } from "express";
import { listAllTransactionsController } from "../controllers/transaction.controller.js";
import { asyncHandler } from "../middleware/async-handler.js";

export const transactionRouter = Router();
transactionRouter.get("/", asyncHandler(listAllTransactionsController));
