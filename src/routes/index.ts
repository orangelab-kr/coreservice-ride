import { Router } from 'express';
import {
  clusterInfo,
  CurrentRideMiddleware,
  getCurrentRouter,
  getHistoriesRouter,
  getInternalRouter,
  getKickboardsRouter,
  getWebhookRouter,
  InternalMiddleware,
  LicenseMiddleware,
  PaymentsMiddleware,
  PromiseMiddleware,
  Region,
  RESULT,
  UserMiddleware,
  Wrapper,
} from '..';

export * from './current';
export * from './histories';
export * from './internal';
export * from './kickboards';
export * from './webhook';

export function getRouter(): Router {
  const router = Router();

  router.use('/kickboards', getKickboardsRouter());
  router.use('/current', UserMiddleware(), getCurrentRouter());
  router.use('/histories', UserMiddleware(), getHistoriesRouter());
  router.use('/internal', InternalMiddleware(), getInternalRouter());
  router.use('/webhook', getWebhookRouter());

  router.get(
    '/',
    Wrapper(async () => {
      throw RESULT.SUCCESS({ details: clusterInfo });
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
    Wrapper(async () => {
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/regions',
    Wrapper(async () => {
      const regions = await Region.getRegions();
      throw RESULT.SUCCESS({ details: { regions } });
    })
  );

  router.get(
    '/location',
    Wrapper(async (req) => {
      const geofence = await Region.getCurrentGeofence(req.query);
      throw RESULT.SUCCESS({ details: { geofence } });
    })
  );

  return router;
}
