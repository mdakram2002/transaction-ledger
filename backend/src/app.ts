import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { accountRouter } from "./routes/account.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { transactionRouter } from "./routes/transaction.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.frontendOrigins }));
app.use(express.json({ limit: "16kb" }));

app.use("/api/health", healthRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRouter);

app.use(notFoundHandler);
app.use(errorHandler);
