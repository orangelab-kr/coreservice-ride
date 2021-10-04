import { Router } from 'express';
import { RESULT, Ride, Wrapper } from '../..';

export function getCurrentLockRouter(): Router {
  const router = Router();

  router.get(
    '/on',
    Wrapper(async (req) => {
      await Ride.lock(req.loggined.ride);
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/off',
    Wrapper(async (req) => {
      await Ride.unlock(req.loggined.ride);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
