import type { NextFunction, Request, Response } from "express";

type AsyncController = (req: Request, res: Response) => Promise<unknown>;

export const asyncHandler = (controller: AsyncController) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(controller(req, res)).catch(next);
  };
