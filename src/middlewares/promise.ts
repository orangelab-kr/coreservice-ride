import { promisify } from 'util';
import { Wrapper, WrapperCallback } from '..';

export function PromiseMiddleware(
  ...WrapperCallbacks: WrapperCallback[]
): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    await Promise.all(
      WrapperCallbacks.map((WrapperCallback) =>
        promisify(WrapperCallback)(req, res)
      )
    );

    next();
  });
}
