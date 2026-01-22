import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'better-sqlite3',
  database: process.env.DATABASE_PATH || './data/utms.db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}));
