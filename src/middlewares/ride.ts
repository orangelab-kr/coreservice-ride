import { Callback, InternalError, OPCODE, Ride, Wrapper } from '..';
import { $$$ } from '../tools';

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

    next();
  });
}

export function CurrentRideMiddleware(props?: {
  allowNull?: boolean;
  throwIfRiding?: boolean;
}): Callback {
  const { allowNull, throwIfRiding } = {
    allowNull: false,
    throwIfRiding: false,
    ...props,
  };

  return Wrapper(async (req, res, next) => {
    const { user } = req.loggined;
    if (!throwIfRiding && !user) {
      throw new InternalError('현재 라이드 중이지 않습니다.', OPCODE.NOT_FOUND);
    }

    const ride =
      allowNull || throwIfRiding
        ? await $$$(Ride.getCurrentRide(user))
        : await Ride.getCurrentRideOrThrow(user);

    if (throwIfRiding && ride) {
      throw new InternalError('이미 라이드 중입니다.', OPCODE.ALREADY_EXISTS);
    }

    req.loggined.ride = ride;
    next();
  });
}
