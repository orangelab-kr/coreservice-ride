import { getPlatformClient } from '..';

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
  geofences: {
    geofenceId: string;
    enabled: boolean;
    name: string;
    geojson: RegionGeofenceModel;
    regionId: string;
    profileId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: null;
    profile: ProfileModel;
  }[];
}

export class Region {
  public static async getRegions(): Promise<RegionModel[]> {
    const { regions } = await getPlatformClient()
      .get('location/regions/all')
      .json<{ opcode: number; regions: RegionModel[] }>();

    return regions;
  }
}
