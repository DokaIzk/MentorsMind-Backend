import { Pool } from 'pg';
import config from './index';

export const pool = new Pool({
  connectionString: config.db.url,
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: config.db.poolMax,
  idleTimeoutMillis: config.db.idleTimeoutMs,
  connectionTimeoutMillis: config.db.connectionTimeoutMs,
});

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export default pool;
