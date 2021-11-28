import { RideModel } from '@prisma/client';
import { getPlatformClient, RideProperties } from '..';

export class BorrowedHelmet {
  public static async getHelmet(
    ride: RideModel,
    props: { deviceInfo?: string }
  ): Promise<any> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const { helmet } = await getPlatformClient()
      .get(`ride/rides/${openapi.rideId}/borrowedHelmet`, {
        searchParams: props,
      })
      .json();

    return helmet;
  }

  public static async borrowHelmet(
    ride: RideModel,
    complete = false
  ): Promise<any> {
    const method = complete ? 'patch' : 'get';
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const { helmet } = await getPlatformClient()
      [method](`ride/rides/${openapi.rideId}/borrowedHelmet/borrow`)
      .json();

    return helmet;
  }

  public static async returnHelmet(
    ride: RideModel,
    complete = false
  ): Promise<any> {
    const method = complete ? 'patch' : 'get';
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const { helmet } = await getPlatformClient()
      [method](`ride/rides/${openapi.rideId}/borrowedHelmet/return`)
      .json();

    return helmet;
  }

  public static async getHelmetCredentials(ride: RideModel): Promise<void> {
    const { openapi } = <RideProperties>(<unknown>ride.properties);
    const { helmet } = await getPlatformClient()
      .get(`ride/rides/${openapi.rideId}/borrowedHelmet/credentials`)
      .json();

    return helmet;
  }
}
