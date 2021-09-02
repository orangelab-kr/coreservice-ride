import { Router } from 'express';
import { Kickboard, OPCODE, Wrapper } from '..';

export function getKickboardsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const kickboards = await Kickboard.getNearKickboard(req.query);
      res.json({ opcode: OPCODE.SUCCESS, kickboards });
    })
  );

  router.get(
    '/:kickboardCode',
    Wrapper(async (req, res) => {
      const kickboardCode = String(req.params.kickboardCode);
      const kickboard = await Kickboard.getKickboard(kickboardCode);
      res.json({ opcode: OPCODE.SUCCESS, kickboard });
    })
  );

  return router;
}
