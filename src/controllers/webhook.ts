import { getCoreServiceClient, prisma, Ride } from '..';

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

export class Webhook {
  public static async onSpeedChange(payload: any): Promise<void> {
    const { geofence, speed, ride } = payload.data;
    await getCoreServiceClient('accounts').post({
      url: `users/${ride.userId}/notifications`,
      json: {
        type: 'info',
        visible: false,
        title: `⚡️ ${geofence.name}(으)로 진입합니다. (${speed}km/h)`,
        description: `안전을 위해 속도가 변경되었습니다.`,
      },
    });
  }

  public static async onTerminate(payload: WebhookTerminate): Promise<void> {
    const {
      userId,
      kickboardCode,
      rideId: openapiRideId,
      terminatedAt: endedAt,
      terminatedType,
    } = payload.data;
    const { rideId } = await Ride.getRideByOpenApiRideIdOrThrow(openapiRideId);
    await prisma.rideModel.update({
      where: { rideId },
      data: { endedAt },
    });

    switch (terminatedType) {
      case 'USER_REQUESTED':
        await getCoreServiceClient('accounts').post({
          url: `users/${userId}/notifications`,
          json: {
            type: 'info',
            title: `🛴 ${kickboardCode} 킥보드 / 이용 종료`,
            description: `라이드가 정상적으로 종료되었습니다. 이용해주셔서 감사합니다.`,
          },
        });
        break;
      case 'ADMIN_REQUESTED':
        await getCoreServiceClient('accounts').post({
          url: `users/${userId}/notifications`,
          json: {
            type: 'info',
            title: `🛴 ${kickboardCode} 킥보드 / 이용 종료`,
            description: `관리자에 의해 강제로 라이드가 종료되었습니다.`,
          },
        });
        break;
      case 'UNUSED':
        await getCoreServiceClient('accounts').post({
          url: `users/${userId}/notifications`,
          json: {
            type: 'info',
            title: `🛴 ${kickboardCode} 킥보드 / 이용 종료`,
            description: `킥보드가 15분 동안 움직임이 없어 자동으로 라이드가 종료되었습니다.`,
          },
        });
        break;
      case 'LOW_BATTEY':
        await getCoreServiceClient('accounts').post({
          url: `users/${userId}/notifications`,
          json: {
            type: 'info',
            title: `🛴 ${kickboardCode} 킥보드 / 이용 종료`,
            description: `킥보드의 배터리 잔량이 얼마남지 않아 자동으로 종료되었습니다.`,
          },
        });
        break;
    }
  }
}
