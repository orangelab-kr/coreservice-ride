import dayjs, { Dayjs } from 'dayjs';
import {
  Callback,
  getAccountsClient,
  InternalError,
  logger,
  OPCODE,
  Wrapper,
} from '..';

export interface LicenseModel {
  licenseId: string;
  userId: string;
  realname: string;
  birthday: Dayjs;
  licenseStr: string;
  createdAt: Dayjs;
  updatedAt: Dayjs;
}

export function LicenseMiddleware(): Callback {
  const accountsClient = getAccountsClient();

  return Wrapper(async (req, res, next) => {
    if (!req.loggined) {
      throw new InternalError('면허 인증 후 이용할 수 있습니다.', OPCODE.ERROR);
    }

    const { userId } = req.loggined.user;
    const { license } = await accountsClient
      .get(`users/${userId}/license?orThrow=true`)
      .json();

    req.loggined.license = {
      licenseId: license.licenseId,
      userId: license.userId,
      realname: license.realname,
      birthday: dayjs(license.birthday),
      licenseStr: license.licenseStr,
      createdAt: dayjs(license.createdAt),
      updatedAt: dayjs(license.updatedAt),
    };

    next();
  });
}
