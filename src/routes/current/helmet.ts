import { Router } from 'express';
import { BorrowedHelmet, RESULT, Wrapper } from '../..';

export function getCurrentHelmetRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { loggined, query } = req;
      const helmet = await BorrowedHelmet.getHelmet(loggined.ride, query);
      throw RESULT.SUCCESS({ details: { helmet } });
    })
  );

  router.get(
    '/credentials',
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      const helmet = await BorrowedHelmet.getHelmetCredentials(ride);
      throw RESULT.SUCCESS({ details: { helmet } });
    })
  );

  router.get(
    '/borrow',
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      const helmet = await BorrowedHelmet.borrowHelmet(ride);
      throw RESULT.SUCCESS({ details: { helmet } });
    })
  );

  router.patch(
    '/borrow',
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      const helmet = await BorrowedHelmet.borrowHelmet(ride, true);
      throw RESULT.SUCCESS({ details: { helmet } });
    })
  );

  router.get(
    '/return',
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      const helmet = await BorrowedHelmet.returnHelmet(ride);
      throw RESULT.SUCCESS({ details: { helmet } });
    })
  );

  router.patch(
    '/return',
    Wrapper(async (req) => {
      const { ride } = req.loggined;
      const helmet = await BorrowedHelmet.returnHelmet(ride, true);
      throw RESULT.SUCCESS({ details: { helmet } });
    })
  );

  return router;
}
