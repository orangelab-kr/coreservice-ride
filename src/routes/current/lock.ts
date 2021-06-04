import { OPCODE, Ride, Wrapper } from '../..';

import { Router } from 'express';

export function getCurrentLockRouter(): Router {
  const router = Router();

  router.get(
    '/on',
    Wrapper(async (req, res) => {
      await Ride.lock(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.get(
    '/off',
    Wrapper(async (req, res) => {
      await Ride.unlock(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
