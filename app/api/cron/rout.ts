import Redis from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await redis.flushdb();
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared',
      time: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}