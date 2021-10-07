import { Router } from 'express';
import {
  $$$,
  getInternalRidesLightsRouter,
  InternalCurrentRideMiddleware,
  InternalLicenseMiddleware,
  InternalPaymentsMiddleware,
  InternalRideByOpenApiRideIdMiddleware,
  InternalRideMiddleware,
  InternalUserByQueryMiddleware,
  PromiseMiddleware,
  RESULT,
  Ride,
  Wrapper,
} from '../../..';

export * from './lights';
export * from './lock';

export function getInternalRidesRouter(): Router {
  const router = Router();

  router.use(
    '/:rideId/lights',
    InternalRideMiddleware({ throwIfRideEnd: true }),
    getInternalRidesLightsRouter()
  );

  router.use(
    '/:rideId/lock',
    InternalRideMiddleware({ throwIfRideEnd: true }),
    getInternalRidesLightsRouter()
  );

  router.get(
    '/byOpenAPI/:rideId',
    InternalRideByOpenApiRideIdMiddleware(),
    Wrapper(async (req) => {
      const { ride } = req.internal;
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  router.get(
    '/',
    Wrapper(async (req) => {
      const { rides, total } = await Ride.getRides(req.query);
      throw RESULT.SUCCESS({ details: { rides, total } });
    })
  );

  router.get(
    '/:rideId',
    InternalRideMiddleware(),
    Wrapper(async (req) => {
      const { ride } = req.internal;
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  router.post(
    '/:rideId',
    InternalRideMiddleware(),
    Wrapper(async (req) => {
      const ride = await $$$(Ride.modifyRide(req.internal.ride, req.body));
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  router.post(
    '/:rideId/photo',
    InternalRideMiddleware(),
    Wrapper(async (req) => {
      await $$$(Ride.setReturnedPhoto(req.internal.ride, req.body));
      throw RESULT.SUCCESS();
    })
  );

  router.post(
    '/',
    InternalUserByQueryMiddleware(),
    PromiseMiddleware(
      InternalCurrentRideMiddleware({ throwIfRiding: true }),
      InternalLicenseMiddleware(),
      InternalPaymentsMiddleware()
    ),
    Wrapper(async (req) => {
      const { query, internal } = req;
      const ride = await $$$(Ride.start(internal.user, query));
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  router.get(
    '/:rideId/status',
    InternalRideMiddleware(),
    Wrapper(async (req) => {
      const status = await Ride.getStatus(req.internal.ride);
      throw RESULT.SUCCESS({ details: { status } });
    })
  );

  // 쿠폰 변경
  router.post(
    '/:rideId/coupon',
    InternalRideMiddleware({ throwIfRideEnd: true }),
    Wrapper(async (req) => {
      const { internal, body } = req;
      await Ride.changeCoupon(internal.ride, body);
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/:rideId/timeline',
    InternalRideMiddleware(),
    Wrapper(async (req) => {
      const timeline = await Ride.getTimeline(req.internal.ride);
      throw RESULT.SUCCESS({ details: { timeline } });
    })
  );

  router.delete(
    '/:rideId',
    InternalRideMiddleware({ throwIfRideEnd: true }),
    Wrapper(async (req) => {
      await Ride.terminate(req.internal.ride, req.query);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
