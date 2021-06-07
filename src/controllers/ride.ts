import { Prisma, RideModel, LocationModel } from '@prisma/client';
import { UserModel, $$$ } from '..';
import {
  Database,
  getPlatformClient,
  InternalError,
  Joi,
  OPCODE,
} from '../tools';

const { prisma } = Database;

export interface RideProperties {
  openapi: { rideId: string };
}

export interface OpenApiRideTimeline {
  latitude: number;
  longitude: number;
  battery: number;
  createdAt: Date;
}

export interface OpenApiRidePricing {
  standard: {
    price: number;
    discount: number;
    total: number;
  };
  perMinute: {
    price: number;
    discount: number;
    total: number;
  };
  surcharge: {
    price: number;
    discount: number;
    total: number;
  };
  isNightly: boolean;
  price: number;
  discount: number;
  total: number;
}

export class Ride {
  public static async start(
    user: UserModel,
    props: {
      kickboardCode: string;
      couponId: string;
      latitude: number;
      longitude: number;
    }
  ): Promise<() => Prisma.Prisma__RideModelClient<RideModel>> {
    const { userId, phoneNo: phone, realname, birthday } = user;
    const isRiding = await $$$(this.getCurrentRide(user));
    if (isRiding) {
      throw new InternalError('이미 라이드 중입니다.', OPCODE.ALREADY_EXISTS);
    }

    const schema = Joi.object({
      kickboardCode: Joi.string().alphanum().required(),
      couponId: Joi.string().uuid().optional(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    });

    const { kickboardCode, longitude, latitude } = await schema.validateAsync(
      props
    );

    const platformClient = getPlatformClient();
    const { rideId } = await platformClient
      .post('ride/rides', {
        json: {
          kickboardCode,
          userId,
          phone,
          realname,
          birthday,
          latitude,
          longitude,
        },
      })
      .json();

    const properties = { openapi: { rideId } };
    const locations = { create: { latitude, longitude } };
    return () => <any>prisma.rideModel.create({
        data: { userId, kickboardCode, properties, locations },
        select: {
          rideId: true,
          userId: true,
          kickboardCode: true,
          locations: false,
          properties: false,
          endedAt: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });
  }

  public static async terminate(
    ride: RideModel,
    props: { latitude: number; longitude: number }
  ): Promise<() => Prisma.Prisma__RideModelClient<RideModel>> {
    const { rideId, properties } = ride;
    const { openapi } = <RideProperties>(<unknown>properties);
    const schema = Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    });

    const endedAt = new Date();
    const { longitude, latitude } = await schema.validateAsync(props);
    const platformClient = getPlatformClient();
    await platformClient
      .delete(`ride/rides/${openapi.rideId}`, {
        searchParams: { latitude, longitude },
      })
      .json();

    return () =>
      prisma.rideModel.update({ where: { rideId }, data: { endedAt } });
  }

  public static async lightsOn(ride: RideModel): Promise<void> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    await getPlatformClient().get(`ride/rides/${openapi.rideId}/lights/on`);
  }

  public static async lightsOff(ride: RideModel): Promise<void> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    await getPlatformClient().get(`ride/rides/${openapi.rideId}/lights/off`);
  }

  public static async lock(ride: RideModel): Promise<void> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    await getPlatformClient().get(`ride/rides/${openapi.rideId}/lock/on`);
  }

  public static async unlock(ride: RideModel): Promise<void> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    await getPlatformClient().get(`ride/rides/${openapi.rideId}/lock/off`);
  }

  public static async addLocation(
    ride: RideModel,
    props: {
      latitude?: number;
      longitude?: number;
    }
  ): Promise<() => Prisma.Prisma__LocationModelClient<LocationModel>> {
    const schema = Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    });

    const { rideId } = ride;
    const { latitude, longitude } = await schema.validateAsync(props);
    return () =>
      prisma.locationModel.create({
        data: { rideId, latitude, longitude },
      });
  }

  public static async getTimeline(
    ride: RideModel
  ): Promise<OpenApiRideTimeline[]> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const { timeline } = await getPlatformClient()
      .get(`ride/rides/${openapi.rideId}/timeline`)
      .json<{ opcode: OPCODE; timeline: OpenApiRideTimeline[] }>();
    return timeline;
  }

  public static async getPricing(
    ride: RideModel,
    props: { latitude?: number; longitude?: number }
  ): Promise<OpenApiRidePricing> {
    const schema = Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    });

    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const searchParams = await schema.validateAsync(props);
    const { pricing } = await getPlatformClient()
      .get(`ride/rides/${openapi.rideId}/pricing`, { searchParams })
      .json<{ opcode: OPCODE; pricing: OpenApiRidePricing }>();
    return pricing;
  }

  public static async getCurrentRide(
    user: UserModel
  ): Promise<() => Prisma.Prisma__RideModelClient<RideModel | null>> {
    const { userId } = user;
    return () =>
      prisma.rideModel.findFirst({
        orderBy: { createdAt: 'desc' },
        where: { userId, endedAt: null },
      });
  }

  public static async getCurrentRideOrThrow(
    user: UserModel
  ): Promise<RideModel> {
    const ride = await $$$(this.getCurrentRide(user));
    if (!ride) {
      throw new InternalError('현재 라이드 중이지 않습니다.', OPCODE.NOT_FOUND);
    }

    return ride;
  }

  public static async getRideOrThrow(
    user: UserModel,
    rideId: string
  ): Promise<RideModel> {
    const ride = await $$$(this.getRide(user, rideId));
    if (!ride) {
      throw new InternalError('라이드를 찾을 수 없습니다.', OPCODE.NOT_FOUND);
    }

    return ride;
  }

  public static async getRide(
    user: UserModel,
    rideId: string
  ): Promise<() => Prisma.Prisma__RideModelClient<RideModel | null>> {
    const { userId } = user;
    return () => prisma.rideModel.findFirst({ where: { userId, rideId } });
  }

  public static async getRides(
    user: UserModel,
    props: {
      take?: number;
      skip?: number;
      search?: string;
      orderByField?: 'createdAt' | 'updatedAt' | 'deletedAt' | 'endedAt';
      orderBySort?: 'asc' | 'desc';
    }
  ): Promise<{ total: number; rides: RideModel[] }> {
    const { userId } = user;
    const schema = Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().default('').allow('').optional(),
      orderByField: Joi.string()
        .valid('endedAt', 'createdAt', 'updatedAt', 'deletedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    });

    const { take, skip, search, orderByField, orderBySort } =
      await schema.validateAsync(props);

    const orderBy = { [orderByField]: orderBySort };
    const where = {
      userId,
      OR: [{ rideId: search }, { userId: search }, { kickboardCode: search }],
    };

    const [total, rides] = await prisma.$transaction([
      prisma.rideModel.count({ where }),
      prisma.rideModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, rides };
  }
}
