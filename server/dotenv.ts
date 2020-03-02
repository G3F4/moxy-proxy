import { config } from 'dotenv';

const nodeEnv = process.env.NODE_ENV;

config({
  path: nodeEnv ? `${process.cwd()}/.env.${nodeEnv.toLowerCase()}` : undefined,
});
