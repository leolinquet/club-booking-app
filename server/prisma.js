import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma Client Instance
 * 
 * This module exports a single PrismaClient instance to be used throughout the application.
 * In development, it uses globalThis to prevent multiple instances during hot reloads.
 * In production, it creates a new instance each time.
 */

const globalForPrisma = globalThis;

export const prisma = 
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Parse DATABASE_URL to extract connection info for logging
 */
export function parseDbUrl(url) {
  try {
    if (!url) return { host: 'unknown', db: 'unknown' };
    
    const parsed = new URL(url);
    const host = parsed.hostname;
    const db = parsed.pathname.slice(1); // remove leading slash
    
    return { host, db };
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL:', error.message);
    return { host: 'unknown', db: 'unknown' };
  }
}

/**
 * Log database connection info on startup
 */
export async function logDbConnection() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const { host, db } = parseDbUrl(dbUrl);
    
    // Test connection and get version info
    const result = await prisma.$queryRaw`SELECT version() as version`;
    const version = result[0]?.version || 'unknown';
    
    console.log(`[db] connected to "${db}" as "${host}"`);
    console.log(`[db] ${version}`);
    
    return { host, db, version };
  } catch (error) {
    console.error('[db] connection failed:', error.message);
    throw error;
  }
}

export default prisma;