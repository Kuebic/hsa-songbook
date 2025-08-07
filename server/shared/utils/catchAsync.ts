import { Request, Response, NextFunction } from 'express'

type AsyncHandler<TRequest = Request> = (
  req: TRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>

export const catchAsync = <TRequest = Request>(
  fn: AsyncHandler<TRequest>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as TRequest, res, next)).catch(next)
  }
}