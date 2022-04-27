import { Router } from 'express';
import { Kickboard, RESULT, Wrapper } from '..';

export function getKickboardsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const kickboards = await Kickboard.getNearKickboard(req.query);
      throw RESULT.SUCCESS({ details: { kickboards } });
    })
  );

  router.post(
    '/qrcode',
    Wrapper(async (req) => {
      const kickboardCode = await Kickboard.getKickboardCodeByQrcode(req.body);
      throw RESULT.SUCCESS({ details: { kickboardCode } });
    })
  );

  router.get(
    '/:kickboardCode',
    Wrapper(async (req) => {
      const kickboardCode = String(req.params.kickboardCode);
      const kickboard = await Kickboard.getKickboard(kickboardCode);
      throw RESULT.SUCCESS({ details: { kickboard } });
    })
  );

  return router;
}
