import { Ride } from '..';
import { Database } from '../tools';

export interface WebhookTerminate {
  requestId: string;
  webhookId: string;
  data: {
    rideId: string;
    kickboardCode: string;
    platformId: string;
    franchiseId: string;
    regionId: string;
    discountGroupId: null;
    discountId: null;
    insuranceId: string;
    userId: string;
    realname: string;
    phone: string;
    birthday: string;
    photo: null;
    startedAt: string;
    startedPhoneLocationId: string;
    startedKickboardLocationId: string;
    terminatedAt: Date;
    terminatedType: string;
    terminatedPhoneLocationId: string;
    terminatedKickboardLocationId: string;
    receiptId: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: null;
    startedPhoneLocation: {
      locationId: string;
      latitude: number;
      longitude: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
    };
    startedKickboardLocation: {
      locationId: string;
      latitude: number;
      longitude: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
    };
    terminatedPhoneLocation: null;
    terminatedKickboardLocation: null;
    receipt: {
      receiptId: string;
      standardId: string;
      perMinuteId: string;
      surchargeId: string;
      isNightly: boolean;
      price: number;
      discount: number;
      total: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: null;
    };
  };
  completedAt: null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
  webhook: {
    webhookId: string;
    type: string;
    platformId: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: null;
  };
}

const { prisma } = Database;

export class Webhook {
  public static async onTerminate(payload: WebhookTerminate): Promise<void> {
    const { rideId: openapiRideId, terminatedAt: endedAt } = payload.data;
    const { rideId } = await Ride.getRideByOpenApiRideIdOrThrow(openapiRideId);
    await prisma.rideModel.update({
      where: { rideId },
      data: { endedAt },
    });
  }
}
