import {
  Callback,
  getPaymentsClient,
  InternalError,
  OPCODE,
  Wrapper,
} from '..';

export function PaymentsMiddleware(): Callback {
  const paymentsClient = getPaymentsClient();

  return Wrapper(async (req, res, next) => {
    if (!req.loggined) {
      throw new InternalError(
        '결제 실패 내역이 있습니다. 결제 완료 후 진행해주세요.',
        OPCODE.ERROR
      );
    }

    const { userId } = req.loggined.user;
    await paymentsClient.get(`${userId}/ready`);
    next();
  });
}
