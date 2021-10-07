import { RideModel } from '@prisma/client';
import 'express';
import { UserModel } from '../src';

declare global {
  namespace Express {
    interface Request {
      loggined: {
        sessionId: string;
        user: UserModel;
        license?: LicenseModel;
        ride: RideModel;
      };
      internal: {
        sub: string;
        iss: string;
        aud: string;
        iat: Date;
        exp: Date;
        sessionId: string;
        license?: LicenseModel;
        user: UserModel;
        ride: RideModel;
      };
    }
  }
}
