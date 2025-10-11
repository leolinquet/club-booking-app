import { Router } from 'express';
import { prisma, parseDbUrl } from '../prisma.js';

const router = Router();

/**
 * Health check endpoint for database status
 * Returns database connection info and table count
 */
router.get('/db', async (req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const { host, db } = parseDbUrl(dbUrl);
    
    // Get current timestamp
    const nowResult = await prisma.$queryRaw`SELECT NOW() as now`;
    const now = nowResult[0]?.now;
    
    // Count public tables
    const tablesResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    const tables = parseInt(tablesResult[0]?.count || '0');
    
    // Test basic connectivity with a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      host,
      db,
      now,
      tables,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[health/db] Database health check failed:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Basic health check endpoint
 * Returns service status without database dependency
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'club-booking-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;