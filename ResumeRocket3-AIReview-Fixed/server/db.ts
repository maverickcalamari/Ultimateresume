import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/resume_platform",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Test connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}