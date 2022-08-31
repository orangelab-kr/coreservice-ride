import { Router } from 'express';
import { $$$, RESULT, Ride, RideMiddleware, Wrapper } from '..';

export function getHistoriesRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { loggined, query } = req;
      const { rides, total } = await Ride.getRides(query, loggined.user);
      throw RESULT.SUCCESS({ details: { rides, total } });
    })
  );

  router.get(
    '/:rideId',
    RideMiddleware(),
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  router.get(
    '/:rideId/timeline',
    RideMiddleware(),
    Wrapper(async (req) => {
      const timeline = await Ride.getTimeline(req.loggined.ride);
      throw RESULT.SUCCESS({ details: { timeline } });
    })
  );

  router.post(
    '/:rideId/photo',
    RideMiddleware(),
    Wrapper(async (req) => {
      await $$$(Ride.setReturnedPhoto(req.loggined.ride, req.body));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
