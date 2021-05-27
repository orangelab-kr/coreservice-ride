import express, { Application } from 'express';
import morgan from 'morgan';
import os from 'os';
import {
  InternalError,
  logger,
  OPCODE,
  Region,
  UserMiddleware,
  Wrapper,
} from '..';

export function getRouter(): Application {
  const router = express();
  InternalError.registerSentry(router);

  const hostname = os.hostname();
  const logging = morgan('common', {
    stream: { write: (str: string) => logger.info(`${str.trim()}`) },
  });

  router.use(logging);
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  router.get(
    '/',
    Wrapper(async (_req, res) => {
      res.json({
        opcode: OPCODE.SUCCESS,
        mode: process.env.NODE_ENV,
        cluster: hostname,
      });
    })
  );

  router.get(
    '/regions',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const regions = await Region.getRegions();
      res.json({ opcode: OPCODE.SUCCESS, regions });
    })
  );

  router.get(
    '/location',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const geofence = await Region.getCurrentGeofence(req.query);
      res.json({ opcode: OPCODE.SUCCESS, geofence });
    })
  );

  router.all(
    '*',
    Wrapper(async () => {
      throw new InternalError('Invalid API', 404);
    })
  );

  return router;
}
