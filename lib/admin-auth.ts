import { NextRequest } from 'next/server';

export function isAuthorized(req: NextRequest, secretName: 'ADMIN_SECRET' | 'SYNC_SECRET' | 'CRON_SECRET') {
  const expected = process.env[secretName];
  const header = req.headers.get('x-admin-secret');
  const authHeader = req.headers.get('authorization');
  return !!expected && (header === expected || authHeader === `Bearer ${expected}`);
}
