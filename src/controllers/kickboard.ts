import { getPlatformClient, Joi } from '..';

export enum KickboardLost {
  FINAL = 0,
  THIRD = 1,
  SECOND = 2,
  FIRST = 3,
}

export interface KickboardModel {
  kickboardCode: string;
  lost: KickboardLost | null;
  photo: string | null;
  helmetId: string | null;
  status: {
    gps: {
      latitude: number;
      longitude: number;
    };
    power: {
      scooter: {
        battery: number;
      };
    };
  };
}

export class Kickboard {
  public static async getNearKickboard(props: {
    lat?: number;
    lng?: number;
  }): Promise<KickboardModel[]> {
    const schema = await Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    });

    const { lat, lng } = await schema.validateAsync(props);
    const searchParams = { lat, lng, radius: 1000 };
    const { kickboards } = await getPlatformClient()
      .get('kickboard/near', { searchParams })
      .json<{ opcode: number; kickboards: KickboardModel[]; total: number }>();

    return kickboards;
  }

  public static async getKickboard(
    kickboardCode: string
  ): Promise<KickboardModel> {
    const { kickboard } = await getPlatformClient()
      .get(`kickboard/${kickboardCode}`)
      .json<{ opcode: number; kickboard: KickboardModel }>();

    return kickboard;
  }
}
