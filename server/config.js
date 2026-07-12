import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  meiliHost: process.env.MEILI_HOST || 'http://127.0.0.1:7700',
  meiliMasterKey: process.env.MEILI_MASTER_KEY || 'change-me-master-key',
  meiliIndex: process.env.MEILI_INDEX || 'pages',

  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  adminUser: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
};
