import { getPlatformClient, Joi } from '..';

export interface PricingModel {
  pricingId: string;
  name: string;
  standardPrice: number;
  nightlyPrice: number;
  standardTime: number;
  perMinuteStandardPrice: number;
  perMinuteNightlyPrice: number;
  surchargePrice: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

export interface RegionGeofenceModel {
  geofenceId: string;
  enabled: boolean;
  name: string;
  geojson: RegionGeofenceGeojsonModel;
  regionId: string;
  region: RegionModel;
  profileId: string;
  profile: ProfileModel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

export interface RegionGeofenceGeojsonModel {
  type: 'Polygon';
  coordinates: [[[number, number][]]];
}

export interface ProfileModel {
  profileId: string;
  name: string;
  priority: number;
  speed: number;
  color: string;
  canReturn: boolean;
  hasSurcharge: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
}

export interface RegionModel {
  regionId: string;
  enabled: boolean;
  name: string;
  pricingId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: null;
  pricing: PricingModel;
  geofences: RegionGeofenceModel[];
}

export class Region {
  public static async getRegions(): Promise<RegionModel[]> {
    const { regions } = await getPlatformClient()
      .get('location/regions/all')
      .json<{ opcode: number; regions: RegionModel[] }>();

    return regions;
  }

  public static async getRegion(regionId: string): Promise<RegionModel> {
    const { region } = await getPlatformClient()
      .get(`location/regions/${regionId}`)
      .json<{ opcode: number; region: RegionModel }>();

    return region;
  }

  public static async getCurrentGeofence(props: {
    lat?: number;
    lng?: number;
  }): Promise<RegionGeofenceModel> {
    const schema = Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required(),
    });

    const searchParams = await schema.validateAsync(props);
    const { geofence } = await getPlatformClient()
      .get('location/geofences', { searchParams })
      .json<{ opcode: number; geofence: RegionGeofenceModel }>();

    return geofence;
  }
}
