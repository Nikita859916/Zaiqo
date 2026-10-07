import { Router } from 'express';
import { getDBStatus } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    status: 'online',
    project: 'Zaiqo Backend API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      auth: 'ready',
    },
    message: 'Zaiqo API is operational',
  });
});

export default router;
