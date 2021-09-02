import { Router } from 'express';
import { $$$, OPCODE, Ride, RideMiddleware, Wrapper } from '..';

export function getHistoriesRouter(): Router {
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

  router.post(
    '/:rideId/photo',
    RideMiddleware(),
    Wrapper(async (req, res) => {
      await $$$(Ride.setReturnedPhoto(req.loggined.ride, req.body));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
