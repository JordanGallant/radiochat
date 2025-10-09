import Redis from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  host: "redis-14419.c282.east-us-mz.azure.redns.redis-cloud.com",
  port: 14419,
  password: "NiSfoLGL1VdxK5hVdkCTVETm4BQDkZFE",
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