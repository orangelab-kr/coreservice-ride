import { Router } from 'express';
import { RESULT, Ride, Wrapper } from '../../..';

export function getInternalRidesLockRouter(): Router {
  const router = Router();

  router.get(
    '/on',
    Wrapper(async (req) => {
      await Ride.lock(req.internal.ride);
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/off',
    Wrapper(async (req) => {
      await Ride.unlock(req.internal.ride);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
