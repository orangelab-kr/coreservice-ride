import { Router } from 'express';
import { $$$, LicenseMiddleware, OPCODE, Wrapper } from '..';
import { Ride } from '../controllers/ride';
import { CurrentRideMiddleware } from '../middlewares';

export function getCurrentRouter() {
  const router = Router();

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
      const ride = await $$$(
        Ride.terminate(req.loggined.ride, req.query as any)
      );

      res.json({ opcode: OPCODE.SUCCESS, ride });
    })
  );

  return router;
}
