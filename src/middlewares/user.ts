import dayjs, { Dayjs } from 'dayjs';
import { getCoreServiceClient, RESULT, Wrapper, WrapperCallback } from '..';

export interface UserModel {
  userId: string;
  realname: string;
  phoneNo: string;
  email?: string;
  birthday: Dayjs;
  usedAt: Dayjs;
  createdAt: Dayjs;
  updatedAt: Dayjs;
}

export function UserMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { headers } = req;
    const { authorization } = headers;
    if (typeof authorization !== 'string') throw RESULT.REQUIRED_LOGIN();
    const sessionId = authorization.substring(7);
    const { user } = await getCoreServiceClient('accounts')
      .post(`users/authorize`, { json: { sessionId } })
      .json<{ opcode: number; user: UserModel }>();

    const payload: any = {
      sessionId,
      user: {
        userId: user.userId,
        realname: user.realname,
        phoneNo: user.phoneNo,
        email: user.email,
        birthday: dayjs(user.birthday),
        usedAt: dayjs(user.usedAt),
        createdAt: dayjs(user.createdAt),
        updatedAt: dayjs(user.updatedAt),
      },
    };

    req.loggined = payload;
    next();
  });
}
