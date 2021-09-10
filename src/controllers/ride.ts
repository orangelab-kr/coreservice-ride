import { LocationModel, Prisma, RideModel } from '@prisma/client';
import { $$$, UserModel } from '..';
import {
  Database,
  getPaymentsClient,
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

export interface RideStatus {
  gps: {
    latitude: number;
    longitude: number;
    satelliteUsedCount: number;
    isValid: boolean;
    speed: number;
  };
  power: {
    speedLimit: number;
    scooter: {
      battery: number;
    };
  };
  isEnabled: boolean;
  isLightsOn: boolean;
  isFallDown: boolean;
  speed: number;
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

export interface CouponModel {
  couponId: string;
  userId: string;
  couponGroupId: string;
  properties?: {
    openapi?: {
      discountId: string;
      discountGroupId: string;
    };
  };
  usedAt: Date | null;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

export class Ride {
  public static async getCoupon(
    user: UserModel,
    couponId: string
  ): Promise<CouponModel> {
    const { userId } = user;
    const paymentsClient = getPaymentsClient();
    const { coupon } = await paymentsClient
      .get(`${userId}/coupons/${couponId}`)
      .json<{ opcode: OPCODE; coupon: CouponModel }>();

    return coupon;
  }

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
    const schema = Joi.object({
      kickboardCode: Joi.string().alphanum().required(),
      couponId: Joi.string().uuid().optional(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
    });

    const { kickboardCode, longitude, latitude, couponId } =
      await schema.validateAsync(props);

    let discountId: string | undefined;
    let discountGroupId: string | undefined;
    if (couponId) {
      const coupon = await this.getCoupon(user, couponId);
      if (!coupon.properties || !coupon.properties.openapi) {
        throw new InternalError('적용할 수 없는 쿠폰입니다.', OPCODE.ERROR);
      }

      discountId = coupon.properties.openapi.discountId;
      discountGroupId = coupon.properties.openapi.discountGroupId;
    }

    const { rideId } = await getPlatformClient()
      .post('ride/rides', {
        json: {
          kickboardCode,
          userId,
          phone,
          realname,
          birthday,
          latitude,
          longitude,
          discountId,
          discountGroupId,
        },
      })
      .json();

    const properties = { openapi: { rideId } };
    const locations = { create: { latitude, longitude } };
    return () => <any>prisma.rideModel.create({
        data: { userId, kickboardCode, properties, locations },
      });
  }

  public static async terminate(
    ride: RideModel,
    props: { latitude?: number; longitude?: number }
  ): Promise<void> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const schema = Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional(),
    });

    const { longitude, latitude } = await schema.validateAsync(props);
    const platformClient = getPlatformClient();
    await platformClient
      .delete(`ride/rides/${openapi.rideId}`, {
        searchParams: { latitude, longitude },
      })
      .json();
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

  public static async getStatus(ride: RideModel): Promise<RideStatus> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    return getPlatformClient()
      .get(`ride/rides/${openapi.rideId}/status`)
      .json();
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

  public static async setReturnedPhoto(
    ride: RideModel,
    props: { photo: string }
  ): Promise<() => Prisma.Prisma__RideModelClient<RideModel>> {
    const { rideId, properties } = ride;
    const schema = Joi.object({ photo: Joi.string().uri().required() });
    const { openapi } = <RideProperties>(<unknown>properties);
    const json = await schema.validateAsync(props);
    const { photo } = json;

    await getPlatformClient()
      .post(`ride/rides/${openapi.rideId}/photo`, { json })
      .json<{ opcode: OPCODE }>();

    return () =>
      prisma.rideModel.update({ where: { rideId }, data: { photo } });
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

  public static async getRideByOpenApiRideId(
    rideId: string
  ): Promise<() => Prisma.Prisma__RideModelClient<RideModel | null>> {
    return () =>
      prisma.rideModel.findFirst({
        where: { properties: { equals: { openapi: { rideId } } } },
      });
  }

  public static async getRideByOpenApiRideIdOrThrow(
    rideId: string
  ): Promise<RideModel> {
    const ride = await $$$(this.getRideByOpenApiRideId(rideId));
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
      search: Joi.string().allow('').optional(),
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
      OR: [{ kickboardCode: { contains: search } }],
    };

    const [total, rides] = await prisma.$transaction([
      prisma.rideModel.count({ where }),
      prisma.rideModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, rides };
  }
}
