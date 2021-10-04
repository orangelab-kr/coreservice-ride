import { RESULT, Ride, Wrapper } from '../..';

import { Router } from 'express';

export function getCurrentLightsRouter(): Router {
  const router = Router();

  router.get(
    '/on',
    Wrapper(async (req) => {
      await Ride.lightsOn(req.loggined.ride);
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/off',
    Wrapper(async (req) => {
      await Ride.lightsOff(req.loggined.ride);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
