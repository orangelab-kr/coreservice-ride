import 'express';
import { UserModel } from '../src';

declare global {
  namespace Express {
    interface Request {
      loggined?: {
        sessionId: string;
        user: UserModel;
        license?: LicenseModel;
      };
    }
  }
}
