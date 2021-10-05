import { WrapperResult, WrapperResultLazyProps } from '.';

export function $_$(
  opcode: number,
  statusCode: number,
  message?: string,
  reportable?: boolean
): (props?: WrapperResultLazyProps) => WrapperResult {
  return (lazyOptions: WrapperResultLazyProps = {}) =>
    new WrapperResult({
      opcode,
      statusCode,
      message,
      reportable,
      ...lazyOptions,
    });
}

export const RESULT = {
  /** SAME ERRORS  */
  SUCCESS: $_$(0, 200),
  REQUIRED_ACCESS_KEY: $_$(301, 401, 'REQUIRED_ACCESS_KEY'),
  EXPIRED_ACCESS_KEY: $_$(302, 401, 'EXPIRED_ACCESS_KEY'),
  PERMISSION_DENIED: $_$(303, 403, 'PERMISSION_DENIED'),
  REQUIRED_LOGIN: $_$(304, 401, 'REQUIRED_LOGIN'),
  INVALID_ERROR: $_$(305, 500, 'INVALID_ERROR', true),
  FAILED_VALIDATE: $_$(306, 400, 'FAILED_VALIDATE'),
  INVALID_API: $_$(307, 404, 'INVALID_API'),
  /** CUSTOM ERRORS  */
  CURRENT_NOT_RIDING: $_$(308, 404, 'CURRENT_NOT_RIDING'),
  ALREADY_RIDING: $_$(309, 409, 'ALREADY_RIDING'),
  CANNOT_FIND_RIDE: $_$(310, 404, 'CANNOT_FIND_RIDE'),
  COUPON_INVALID_DAY_OF_WEEK: $_$(311, 400, 'COUPON_INVALID_DAY_OF_WEEK'),
  COUPON_LIMIT_COUNT: $_$(312, 400, 'COUPON_LIMIT_COUNT'),
  COUPON_LIMIT_COUNT_OF_PERIOD: $_$(313, 400, 'COUPON_LIMIT_COUNT_OF_PERIOD'),
};
