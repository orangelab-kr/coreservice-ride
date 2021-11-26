import { Router } from 'express';
import { RESULT, Webhook, Wrapper } from '..';

export function getWebhookRouter(): Router {
  const router = Router();

  router.post(
    '/terminate',
    Wrapper(async (req) => {
      await Webhook.onTerminate(req.body);
      throw RESULT.SUCCESS();
    })
  );

  router.post(
    '/speedChange',
    Wrapper(async (req) => {
      await Webhook.onSpeedChange(req.body);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
