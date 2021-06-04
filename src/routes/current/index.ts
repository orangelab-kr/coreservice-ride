import { Router } from 'express';
import {
  $$$,
  CurrentRideMiddleware,
  getCurrentLightsRouter,
  getCurrentLockRouter,
  LicenseMiddleware,
  OPCODE,
  Ride,
  Wrapper,
} from '../..';

export * from './lights';
export * from './lock';

export function getCurrentRouter() {
  const router = Router();

  router.use('/lights', CurrentRideMiddleware(), getCurrentLightsRouter());
  router.use('/lock', CurrentRideMiddleware(), getCurrentLockRouter());

  // 라이딩 정보
  router.get(
    '/',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const { ride } = req.loggined;
      res.json({ opcode: OPCODE.SUCCESS, ride });
    })
  );

  // 라이딩 시작
  router.post(
    '/',
    LicenseMiddleware(),
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
      await $$$(Ride.terminate(req.loggined.ride, req.query as any));
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

  router.get(
    '/timeline',
    CurrentRideMiddleware(),
    Wrapper(async (req, res) => {
      const timeline = await Ride.getTimeline(req.loggined.ride);
      res.json({ opcode: OPCODE.SUCCESS, timeline });
    })
  );

  return router;
}
