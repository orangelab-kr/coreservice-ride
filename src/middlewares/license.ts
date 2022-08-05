import dayjs, { Dayjs } from 'dayjs';
import { getCoreServiceClient, RESULT, Wrapper, WrapperCallback } from '..';

export interface LicenseModel {
  licenseId: string;
  userId: string;
  realname: string;
  birthday: Dayjs;
  licenseStr: string;
  createdAt: Dayjs;
  updatedAt: Dayjs;
}

export function LicenseMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    // 당분간 운전면허 인증을 진행하지 않음
    next();
    return;

    if (!req.loggined) throw RESULT.REQUIRED_LOGIN();
    const { userId } = req.loggined.user;
    const { license } = await getCoreServiceClient('accounts')
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
