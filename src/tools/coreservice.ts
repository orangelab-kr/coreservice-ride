import got, { Got } from 'got';
import jwt from 'jsonwebtoken';
import { InternalError } from './error';

let accountsClient: Got | null;
let paymentsClient: Got | null;
let accountsAccessKey: string | null;
let paymentsAccessKey: string | null;

function getAccountsToken(props: {
  iss: string;
  aud: string;
  secretKey: string;
}): string {
  const { iss, aud, secretKey } = props;
  if (accountsAccessKey) {
    try {
      const opts = { json: true };
      const decodedPayload: any = jwt.decode(accountsAccessKey, opts);
      if (decodedPayload.exp * 1000 > Date.now()) return accountsAccessKey;
    } catch (err) {}
  }

  const sub = 'coreservice-accounts';
  const options = { expiresIn: '1h' };
  const token = jwt.sign({ sub, iss, aud }, secretKey, options);
  accountsAccessKey = token;
  return token;
}

export function getAccountsClient(): Got {
  if (accountsClient) return accountsClient;
  const {
    HIKICK_CORESERVICE_RIDE_URL,
    HIKICK_CORESERVICE_ACCOUNTS_URL,
    HIKICK_CORESERVICE_ACCOUNTS_KEY,
  } = process.env;
  if (
    !HIKICK_CORESERVICE_RIDE_URL ||
    !HIKICK_CORESERVICE_ACCOUNTS_URL ||
    !HIKICK_CORESERVICE_ACCOUNTS_KEY
  ) {
    throw new Error('계정 서비스 인증 정보가 없습니다.');
  }

  accountsClient = got.extend({
    retry: 0,
    prefixUrl: `${HIKICK_CORESERVICE_ACCOUNTS_URL}/internal`,
    hooks: {
      beforeRequest: [
        (opts) => {
          getAccountsToken({
            aud: 'system@hikick.kr',
            iss: HIKICK_CORESERVICE_RIDE_URL,
            secretKey: HIKICK_CORESERVICE_ACCOUNTS_KEY,
          });

          opts.headers['Authorization'] = `Bearer ${accountsAccessKey}`;
        },
      ],
      beforeError: [
        (err: any): any => {
          if (!err.response || !err.response.body) return err;
          const { opcode, message } = JSON.parse(<string>err.response.body);

          err.name = 'InternalError';
          err.opcode = opcode;
          err.message = message;
          return err;
        },
      ],
    },
  });

  return accountsClient;
}

function getPaymentsToken(props: {
  iss: string;
  aud: string;
  secretKey: string;
}): string {
  const { iss, aud, secretKey } = props;
  if (paymentsAccessKey) {
    try {
      const opts = { json: true };
      const decodedPayload: any = jwt.decode(paymentsAccessKey, opts);
      if (decodedPayload.exp * 1000 > Date.now()) return paymentsAccessKey;
    } catch (err) {}
  }

  const sub = 'coreservice-payments';
  const options = { expiresIn: '1h' };
  const token = jwt.sign({ sub, iss, aud }, secretKey, options);
  paymentsAccessKey = token;
  return token;
}

export function getPaymentsClient(): Got {
  if (paymentsClient) return paymentsClient;
  const {
    HIKICK_CORESERVICE_RIDE_URL,
    HIKICK_CORESERVICE_PAYMENTS_URL,
    HIKICK_CORESERVICE_PAYMENTS_KEY,
  } = process.env;
  if (
    !HIKICK_CORESERVICE_RIDE_URL ||
    !HIKICK_CORESERVICE_PAYMENTS_URL ||
    !HIKICK_CORESERVICE_PAYMENTS_KEY
  ) {
    throw new Error('계정 서비스 인증 정보가 없습니다.');
  }

  paymentsClient = got.extend({
    retry: 0,
    prefixUrl: `${HIKICK_CORESERVICE_PAYMENTS_URL}/internal`,
    hooks: {
      beforeRequest: [
        (opts) => {
          getPaymentsToken({
            aud: 'system@hikick.kr',
            iss: HIKICK_CORESERVICE_RIDE_URL,
            secretKey: HIKICK_CORESERVICE_PAYMENTS_KEY,
          });

          opts.headers['Authorization'] = `Bearer ${paymentsAccessKey}`;
        },
      ],
      beforeError: [
        (err: any): any => {
          if (!err.response || !err.response.body) return err;
          const { opcode, message } = JSON.parse(<string>err.response.body);

          err.name = 'InternalError';
          err.opcode = opcode;
          err.message = message;
          return err;
        },
      ],
    },
  });

  return paymentsClient;
}
