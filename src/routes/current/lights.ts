import { OPCODE, Ride, Wrapper } from '../..';

import { Router } from 'express';

export function getCurrentLightsRouter(): Router {
  const router = Router();

  router.get(
    '/on',
    Wrapper(async (req, res) => {
      await Ride.lightsOn(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.get(
    '/off',
    Wrapper(async (req, res) => {
      await Ride.lightsOff(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
