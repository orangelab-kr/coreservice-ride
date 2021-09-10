import { Router } from 'express';
import { OPCODE, Webhook, Wrapper } from '..';

export function getWebhookRouter(): Router {
  const router = Router();

  router.post(
    '/terminate',
    Wrapper(async (req, res) => {
      await Webhook.onTerminate(req.body);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
