import { Router } from 'express';
import { getInternalRidesRouter } from './rides';

export * from './rides';

export function getInternalRouter(): Router {
  const router = Router();

  router.use('/rides', getInternalRidesRouter());

  return router;
}
