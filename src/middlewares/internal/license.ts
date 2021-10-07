import dayjs from 'dayjs';
import { getCoreServiceClient, RESULT, Wrapper, WrapperCallback } from '../..';

export function InternalLicenseMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    if (!req.internal) throw RESULT.REQUIRED_LOGIN();
    const { userId } = req.internal.user;
    const { license } = await getCoreServiceClient('accounts')
      .get(`users/${userId}/license?orThrow=true`)
      .json();

    req.internal.license = {
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
