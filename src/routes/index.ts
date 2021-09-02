import { Router } from 'express';
import {
  clusterInfo,
  CurrentRideMiddleware,
  getCurrentRouter,
  getHistoriesRouter,
  getKickboardsRouter,
  LicenseMiddleware,
  OPCODE,
  PaymentsMiddleware,
  PromiseMiddleware,
  Region,
  UserMiddleware,
  Wrapper,
} from '..';

export * from './current';
export * from './histories';
export * from './kickboards';

export function getRouter(): Router {
  const router = Router();

  router.use('/kickboards', getKickboardsRouter());
  router.use('/current', UserMiddleware(), getCurrentRouter());
  router.use('/histories', UserMiddleware(), getHistoriesRouter());

  router.get(
    '/',
    Wrapper(async (_req, res) => {
      res.json({
        opcode: OPCODE.SUCCESS,
        ...clusterInfo,
      });
    })
  );

  router.get(
    '/ready',
    UserMiddleware(),
    PromiseMiddleware(
      CurrentRideMiddleware({ throwIfRiding: true }),
      LicenseMiddleware(),
      PaymentsMiddleware()
    ),
    Wrapper(async (req, res) => res.json({ opcode: OPCODE.SUCCESS }))
  );

  router.get(
    '/regions',
    Wrapper(async (req, res) => {
      const regions = await Region.getRegions();
      res.json({ opcode: OPCODE.SUCCESS, regions });
    })
  );

  router.get(
    '/location',
    Wrapper(async (req, res) => {
      const geofence = await Region.getCurrentGeofence(req.query);
      res.json({ opcode: OPCODE.SUCCESS, geofence });
    })
  );

  return router;
}
