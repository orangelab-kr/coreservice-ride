import { getCoreServiceClient, RESULT, Wrapper, WrapperCallback } from '../..';

export function InternalPaymentsMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    if (!req.internal) throw RESULT.REQUIRED_LOGIN();
    const { userId } = req.internal.user;
    await getCoreServiceClient('payments').get(`users/${userId}/ready`);
    next();
  });
}
