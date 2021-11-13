import { Router } from 'express';
import {
  $$$,
  CurrentRideMiddleware,
  getCurrentLightsRouter,
  getCurrentLockRouter,
  LicenseMiddleware,
  PaymentsMiddleware,
  PromiseMiddleware,
  RESULT,
  Ride,
  Wrapper,
} from '../..';

export * from './lights';
export * from './lock';

export function getCurrentRouter(): Router {
  const router = Router();

  router.use('/lights', CurrentRideMiddleware(), getCurrentLightsRouter());
  router.use('/lock', CurrentRideMiddleware(), getCurrentLockRouter());

  // 라이딩 정보
  router.get(
    '/',
    CurrentRideMiddleware({ allowNull: true }),
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  // 라이딩 시작
  router.post(
    '/',
    PromiseMiddleware(
      CurrentRideMiddleware({ throwIfRiding: true }),
      LicenseMiddleware(),
      PaymentsMiddleware()
    ),
    Wrapper(async (req) => {
      const { query, loggined } = req;
      const ride = await $$$(Ride.start(loggined.user, query));
      throw RESULT.SUCCESS({ details: { ride } });
    })
  );

  // 라이딩 종료
  router.delete(
    '/',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      await Ride.terminate(req.loggined.ride, req.query);
      throw RESULT.SUCCESS();
    })
  );

  // 킥보드 상태
  router.get(
    '/status',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      const status = await Ride.getStatus(req.loggined.ride);
      throw RESULT.SUCCESS({ details: { status } });
    })
  );

  // 쿠폰 변경
  router.post(
    '/coupon',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      const { loggined, body } = req;
      await Ride.changeCoupon(loggined.ride, body);
      throw RESULT.SUCCESS();
    })
  );

  // 위치 추가
  router.get(
    '/location',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      const { query, loggined } = req;
      await $$$(Ride.addLocation(loggined.ride, query));
      throw RESULT.SUCCESS();
    })
  );

  // 킥보드 위치
  router.get(
    '/timeline',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      const timeline = await Ride.getTimeline(req.loggined.ride);
      throw RESULT.SUCCESS({ details: { timeline } });
    })
  );

  // 가격
  router.get(
    '/pricing',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      const { loggined, query } = req;
      const pricing = await Ride.getPricing(loggined.ride, query);
      throw RESULT.SUCCESS({ details: { pricing } });
    })
  );

  // 속도 변경
  router.get(
    '/maxSpeed',
    CurrentRideMiddleware(),
    Wrapper(async (req) => {
      const { loggined, query } = req;
      await Ride.setMaxSpeed(loggined.ride, query);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
