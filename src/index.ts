import serverless from 'serverless-http';
import { getRouter } from '.';

export * from './controllers';
export * from './middlewares';
export * from './routes';
export * from './tools';

const options = { basePath: '/v1/ride' };
export const handler = serverless(getRouter(), options);
