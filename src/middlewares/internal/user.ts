import dayjs from 'dayjs';
import {
  getCoreServiceClient,
  Joi,
  RESULT,
  Wrapper,
  WrapperCallback,
} from '../..';

export function InternalUserMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { userId } = req.params;
    if (typeof userId !== 'string') throw new Error();
    const { user } = await getCoreServiceClient('accounts')
      .get(`users/${userId}`)
      .json();

    req.internal.user = {
      userId: user.userId,
      realname: user.realname,
      phoneNo: user.phoneNo,
      email: user.email,
      birthday: dayjs(user.birthday),
      usedAt: dayjs(user.usedAt),
      createdAt: dayjs(user.createdAt),
      updatedAt: dayjs(user.updatedAt),
    };

    next();
  });
}

export function InternalUserByQueryMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { userId } = await Joi.object({
      userId: Joi.string().uuid().required(),
    }).validateAsync(req.query);
    const { user } = await getCoreServiceClient('accounts')
      .get(`users/${userId}`)
      .json();

    req.internal.user = {
      userId: user.userId,
      realname: user.realname,
      phoneNo: user.phoneNo,
      email: user.email,
      birthday: dayjs(user.birthday),
      usedAt: dayjs(user.usedAt),
      createdAt: dayjs(user.createdAt),
      updatedAt: dayjs(user.updatedAt),
    };

    next();
  });
}
