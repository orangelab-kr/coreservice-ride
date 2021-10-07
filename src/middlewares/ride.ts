import { $$$, RESULT, Ride, Wrapper, WrapperCallback } from '..';

export function RideMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      loggined: { user },
      params: { rideId },
    } = req;

    if (!user || typeof rideId !== 'string') throw RESULT.CANNOT_FIND_RIDE();
    req.loggined.ride = await Ride.getRideOrThrow(rideId, user);

    next();
  });
}

export function CurrentRideMiddleware(props?: {
  allowNull?: boolean;
  throwIfRiding?: boolean;
}): WrapperCallback {
  const { allowNull, throwIfRiding } = {
    allowNull: false,
    throwIfRiding: false,
    ...props,
  };

  return Wrapper(async (req, res, next) => {
    const { user } = req.loggined;
    if (!throwIfRiding && !user) throw RESULT.CURRENT_NOT_RIDING();

    const ride =
      allowNull || throwIfRiding
        ? await $$$(Ride.getCurrentRide(user))
        : await Ride.getCurrentRideOrThrow(user);

    if (throwIfRiding && ride) throw RESULT.ALREADY_RIDING();
    req.loggined.ride = ride;
    next();
  });
}
