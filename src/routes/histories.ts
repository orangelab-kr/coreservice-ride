import { Router } from 'express';
import { OPCODE, Ride, Wrapper } from '..';
import { RideMiddleware } from '../middlewares';

export function getHistoriesRouter() {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { loggined, query } = req;
      const { rides, total } = await Ride.getRides(loggined.user, query);
      res.json({ opcode: OPCODE.SUCCESS, rides, total });
    })
  );

  router.get(
    '/:rideId',
    RideMiddleware(),
    Wrapper(async (req, res) => {
      const { ride } = req.loggined;
      res.json({ opcode: OPCODE.SUCCESS, ride });
    })
  );

  return router;
}
