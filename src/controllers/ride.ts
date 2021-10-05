import { LocationModel, Prisma, RideModel } from '@prisma/client';
import dayjs from 'dayjs';
import {
  $$$,
  getPaymentsClient,
  getPlatformClient,
  Joi,
  prisma,
  RESULT,
  UserModel,
} from '..';

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
  couponGroup: CouponGroupModel;
  properties: CouponPropertiesModel;
  usedAt: Date | null;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

export interface CouponGroupModel {
  couponGroupId: string;
  code: string;
  type: 'LONGTIME' | 'ONETIME';
  name: string;
  description: string;
  validity: number;
  limit: number;
  properties: CouponGroupPropertiesModel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

export interface CouponPropertiesModel {
  openapi?: {
    discountId: string;
    discountGroupId: string;
    expiredAt: Date;
  };
}

export interface CouponGroupPropertiesModel {
  openapi?: {
    discountGroupId: string;
  };
  coreservice?: {
    dayOfWeek?: number;
    period?: number;
    count?: number;
  };
}

export class Ride {
  public static async getCouponOrThrow(
    userId: string,
    couponId: string
  ): Promise<CouponModel> {
    const { coupon } = await getPaymentsClient()
      .get(`${userId}/coupons/${couponId}`)
      .json<{ opcode: number; coupon: CouponModel }>();

    return coupon;
  }

  public static async verifyCouponProperties(
    coupon: CouponModel
  ): Promise<void> {
    console.log(coupon);
    if (!coupon.couponGroup.properties?.coreservice) return;
    const { dayOfWeek, period, count } =
      coupon.couponGroup.properties.coreservice;

    if (dayOfWeek) {
      const todayDayOfWeek = dayjs().day();
      const allowDayOfWeek = dayOfWeek
        .toString(2)
        .padStart(7, '0')
        .split('')
        .reverse()
        .map((v) => v === '1');

      console.log(allowDayOfWeek);
      if (!allowDayOfWeek[todayDayOfWeek]) {
        throw RESULT.COUPON_INVALID_DAY_OF_WEEK();
      }
    }

    if (count) {
      const { userId, couponId } = coupon;
      const startedAt = period
        ? dayjs().subtract(period, 'days').toDate()
        : undefined;

      const { total } = await Ride.getRides({
        userId,
        couponId,
        startedAt,
        take: 0,
      });

      console.log(total);
      if (total >= count) {
        const args = [`${count}`, `${period}`];
        throw period
          ? RESULT.COUPON_LIMIT_COUNT_OF_PERIOD({ args })
          : RESULT.COUPON_LIMIT_COUNT({ args });
      }
    }
  }

  public static async redeemCoupon(
    userId: string,
    couponId: string
  ): Promise<CouponPropertiesModel> {
    const { properties } = await getPaymentsClient()
      .get(`${userId}/coupons/${couponId}/redeem`)
      .json<{ opcode: number; properties: CouponPropertiesModel }>();

    return properties;
  }

  public static async modifyCoupon(
    userId: string,
    couponId: string,
    props: {
      usedAt?: Date | null;
      expiredAt?: Date | null;
    }
  ): Promise<CouponModel> {
    const paymentsClient = getPaymentsClient();
    const { coupon } = await paymentsClient
      .post(`${userId}/coupons/${couponId}`, { json: props })
      .json<{ opcode: number; coupon: CouponModel }>();

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
      const coupon = await this.getCouponOrThrow(userId, couponId);
      await this.verifyCouponProperties(coupon);
      const properties = await this.redeemCoupon(userId, couponId);
      if (properties.openapi) {
        discountId = properties.openapi.discountId;
        discountGroupId = properties.openapi.discountGroupId;
      }
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
        data: { userId, kickboardCode, properties, locations, couponId },
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

  public static async changeCoupon(
    ride: RideModel,
    props: { couponId?: string }
  ): Promise<void> {
    const { properties, userId } = ride;
    const { couponId } = await Joi.object({
      couponId: Joi.string().uuid().allow(null).optional(),
    }).validateAsync(props);

    // if (couponId === ride.couponId) return;
    const rideId = (<RideProperties>(<unknown>properties)).openapi.rideId;
    let discountId: string | undefined;
    let discountGroupId: string | undefined;

    if (couponId) {
      const coupon = await this.getCouponOrThrow(userId, couponId);
      await this.verifyCouponProperties(coupon);
      const properties = await this.redeemCoupon(userId, couponId);
      if (properties.openapi) {
        discountId = properties.openapi.discountId;
        discountGroupId = properties.openapi.discountGroupId;
      }
    }

    if (ride.couponId) {
      await this.modifyCoupon(userId, ride.couponId, { usedAt: null });
    }

    await getPlatformClient().post(`ride/rides/${rideId}/discount`, {
      json: { discountId, discountGroupId },
    });

    await prisma.rideModel.update({
      where: { rideId: ride.rideId },
      data: { couponId },
    });
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
      .json<{ opcode: number; timeline: OpenApiRideTimeline[] }>();
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
      .json<{ opcode: number; pricing: OpenApiRidePricing }>();
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
      .json<{ opcode: number }>();

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
    if (!ride) throw RESULT.CURRENT_NOT_RIDING();
    return ride;
  }

  public static async getRideOrThrow(
    user: UserModel,
    rideId: string
  ): Promise<RideModel> {
    const ride = await $$$(this.getRide(user, rideId));
    if (!ride) throw RESULT.CANNOT_FIND_RIDE();
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
    if (!ride) throw RESULT.CANNOT_FIND_RIDE();
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
    props: {
      take?: number;
      skip?: number;
      search?: string;
      userId?: string;
      couponId?: string;
      startedAt?: Date;
      endedAt?: Date;
      orderByField?: 'createdAt' | 'updatedAt' | 'deletedAt' | 'endedAt';
      orderBySort?: 'asc' | 'desc';
    },
    user?: UserModel
  ): Promise<{ total: number; rides: RideModel[] }> {
    const schema = Joi.object({
      take: Joi.number().default(10).optional(),
      skip: Joi.number().default(0).optional(),
      search: Joi.string().allow('').optional(),
      userId: Joi.string().uuid().optional(),
      couponId: Joi.string().uuid().optional(),
      startedAt: Joi.date().default(new Date(0)).optional(),
      endedAt: Joi.date().default(new Date()).optional(),
      orderByField: Joi.string()
        .valid('endedAt', 'createdAt', 'updatedAt', 'deletedAt')
        .default('createdAt')
        .optional(),
      orderBySort: Joi.string().valid('asc', 'desc').default('desc').optional(),
    });

    const {
      take,
      skip,
      search,
      userId,
      couponId,
      startedAt,
      endedAt,
      orderByField,
      orderBySort,
    } = await schema.validateAsync(props);

    const orderBy = { [orderByField]: orderBySort };
    const where: Prisma.RideModelWhereInput = {
      createdAt: { gte: startedAt, lte: endedAt },
    };

    if (search) {
      where.OR = [
        { kickboardCode: { contains: search } },
        { rideId: { contains: search } },
        { userId: { contains: search } },
        { couponId: { contains: search } },
      ];
    }

    if (userId) where.userId = userId;
    if (couponId) where.couponId = couponId;
    if (user) where.userId = userId;
    const [total, rides] = await prisma.$transaction([
      prisma.rideModel.count({ where }),
      prisma.rideModel.findMany({ where, take, skip, orderBy }),
    ]);

    return { total, rides };
  }
}
