import { getPaymentsClient, RESULT, Wrapper, WrapperCallback } from '..';

export function PaymentsMiddleware(): WrapperCallback {
  const paymentsClient = getPaymentsClient();

  return Wrapper(async (req, res, next) => {
    if (!req.loggined) throw RESULT.REQUIRED_LOGIN();
    const { userId } = req.loggined.user;
    await paymentsClient.get(`users/${userId}/ready`);
    next();
  });
}
