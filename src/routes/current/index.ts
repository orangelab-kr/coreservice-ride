import { Router } from 'express';
import {
  $$$,
  CurrentRideMiddleware,
  getCurrentLightsRouter,
  getCurrentLockRouter,
  LicenseMiddleware,
  OPCODE,
  PaymentsMiddleware,
  PromiseMiddleware,
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
    Wrapper(async (req, res) => {
      const { ride } = req.loggined;
      res.json({ opcode: OPCODE.SUCCESS, ride });
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
    Wrapper(async (req, res) => {
      const { query, loggined } = req;
      const ride = await $$$(Ride.start(loggined.user, query as any));
      res.json({ opcode: OPCODE.SUCCESS, ride });
    })
  );

  // 라이딩 종료
  router.delete(
    '/',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      await Ride.terminate(req.loggined.ride, req.query as any);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  // 킥보드 상태
  router.get(
    '/status',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const status = await Ride.getStatus(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS, status });
    })
  );

  // 쿠폰 변경
  router.post(
    '/coupon',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const { loggined, body } = req;
      await Ride.changeCoupon(loggined.ride, body);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  // 위치 추가
  router.get(
    '/location',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const { query, loggined } = req;
      await $$$(Ride.addLocation(loggined.ride, query as any));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  // 킥보드 위치
  router.get(
    '/timeline',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const timeline = await Ride.getTimeline(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS, timeline });
    })
  );

  // 가격
  router.get(
    '/pricing',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const { loggined, query } = req;
      const pricing = await Ride.getPricing(loggined.ride, query);
      res.json({ opcode: OPCODE.SUCCESS, pricing });
    })
  );

  return router;
}
