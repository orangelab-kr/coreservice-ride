import { Router } from 'express';
import { Region, RESULT, Wrapper } from '..';

export function getRegionsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const geofence = await Region.getCurrentGeofence(req.query);
      throw RESULT.SUCCESS({ details: { geofence } });
    })
  );

  router.get(
    `/:regionId`,
    Wrapper(async (req) => {
      const region = await Region.getRegion(String(req.params.regionId));
      throw RESULT.SUCCESS({ details: { region } });
    })
  );

  return router;
}
