import postgres from 'postgres';

const isLocalDb =
  process.env.POSTGRES_URL?.includes('127.0.0.1') ||
  process.env.POSTGRES_URL?.includes('localhost');

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: isLocalDb ? false : 'require',
});

export default sql;