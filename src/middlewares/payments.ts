import { getCoreServiceClient, RESULT, Wrapper, WrapperCallback } from '..';

export function PaymentsMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    if (!req.loggined) throw RESULT.REQUIRED_LOGIN();
    const { userId } = req.loggined.user;
    await getCoreServiceClient('payments').get(`users/${userId}/ready`);
    next();
  });
}
