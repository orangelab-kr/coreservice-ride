import { RESULT, Ride, Wrapper } from '../../..';

import { Router } from 'express';

export function getInternalRidesLightsRouter(): Router {
  const router = Router();

  router.get(
    '/on',
    Wrapper(async (req) => {
      await Ride.lightsOn(req.internal.ride);
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/off',
    Wrapper(async (req) => {
      await Ride.lightsOff(req.internal.ride);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
