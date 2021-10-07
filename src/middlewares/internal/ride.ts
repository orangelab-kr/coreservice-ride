import { $$$, RESULT, Ride, Wrapper, WrapperCallback } from '../..';

export function InternalRideMiddleware(props?: {
  throwIfRideEnd?: boolean;
}): WrapperCallback {
  const { throwIfRideEnd } = {
    throwIfRideEnd: false,
    ...props,
  };

  return Wrapper(async (req, res, next) => {
    const {
      params: { rideId },
    } = req;

    if (typeof rideId !== 'string') throw RESULT.CANNOT_FIND_RIDE();
    const ride = await Ride.getRideOrThrow(rideId);
    if (throwIfRideEnd && ride.endedAt) throw RESULT.CURRENT_NOT_RIDING();
    req.internal.ride = ride;
    next();
  });
}

export function InternalRideByOpenApiRideIdMiddleware(props?: {
  throwIfRideEnd?: boolean;
}): WrapperCallback {
  const { throwIfRideEnd } = {
    throwIfRideEnd: false,
    ...props,
  };

  return Wrapper(async (req, res, next) => {
    const {
      params: { rideId },
    } = req;

    if (typeof rideId !== 'string') throw RESULT.CANNOT_FIND_RIDE();
    const ride = await Ride.getRideByOpenApiRideIdOrThrow(rideId);
    if (throwIfRideEnd && ride.endedAt) throw RESULT.CURRENT_NOT_RIDING();
    req.internal.ride = ride;
    next();
  });
}

export function InternalCurrentRideMiddleware(props?: {
  allowNull?: boolean;
  throwIfRiding?: boolean;
}): WrapperCallback {
  const { allowNull, throwIfRiding } = {
    allowNull: false,
    throwIfRiding: false,
    ...props,
  };

  return Wrapper(async (req, res, next) => {
    const { user } = req.internal;
    if (!throwIfRiding && !user) throw RESULT.CURRENT_NOT_RIDING();

    const ride =
      allowNull || throwIfRiding
        ? await $$$(Ride.getCurrentRide(user))
        : await Ride.getCurrentRideOrThrow(user);

    if (throwIfRiding && ride) throw RESULT.ALREADY_RIDING();
    req.internal.ride = ride;

    next();
  });
}
