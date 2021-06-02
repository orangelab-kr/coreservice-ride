import { Callback, InternalError, OPCODE, Ride, Wrapper } from '..';

export function RideMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const {
      loggined: { user },
      params: { rideId },
    } = req;

    if (!user || typeof rideId !== 'string') {
      throw new InternalError('라이드를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    const ride = await Ride.getRideOrThrow(user, rideId);
    req.loggined.ride = ride;

    await next();
  });
}

export function CurrentRideMiddleware(): Callback {
  return Wrapper(async (req, res, next) => {
    const { user } = req.loggined;
    if (!user) {
      throw new InternalError('현재 라이드 중이지 않습니다.', OPCODE.NOT_FOUND);
    }

    const ride = await Ride.getCurrentRideOrThrow(user);
    req.loggined.ride = ride;

    await next();
  });
}
