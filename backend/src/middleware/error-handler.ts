import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error.js";

export const notFoundHandler = (_req: any, _res: any, next: any) => {
  next(new HttpError(404, "NOT_FOUND", "Route was not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (err?.code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_TRANSACTION",
        message: "This reference has already been used for this account",
      },
    });
    return;
  }

  const status = err instanceof HttpError ? err.status : 500;
  res.status(status).json({
    success: false,
    error: {
      code: err instanceof HttpError ? err.code : "INTERNAL_ERROR",
      message:
        err instanceof HttpError
          ? err.message
          : "An unexpected server error occurred",
    },
  });
};
