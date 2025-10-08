import { NextResponse } from 'next/server';
import { createClient } from 'redis';

interface Message {
  id: string;
  content: string;
  username: string;
  createdAt: string;
}

// Redis client setup
const client = createClient({
  username: 'default',
  password: 'NiSfoLGL1VdxK5hVdkCTVETm4BQDkZFE',
  socket: {
    host: 'redis-14419.c282.east-us-mz.azure.redns.redis-cloud.com',
    port: 14419
  }
});

client.on('error', err => console.log('Redis Client Error', err));

// Connect to Redis (only once)
let isConnected = false;
async function ensureConnection() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
}

const MESSAGES_KEY = 'chat:messages';
const MAX_MESSAGES = 100;

export async function GET() {
  try {
    await ensureConnection();
    
    // Get all messages from Redis list
    const messagesJson = await client.lRange(MESSAGES_KEY, 0, -1);
    const messages = messagesJson.map(json => JSON.parse(json));
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureConnection();
    
    const body = await request.json();
    const { content, username } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      username: username.trim(),
      createdAt: new Date().toISOString(),
    };

    // Add message to Redis list
    await client.rPush(MESSAGES_KEY, JSON.stringify(newMessage));

    // Keep only last 100 messages
    const messageCount = await client.lLen(MESSAGES_KEY);
    if (messageCount > MAX_MESSAGES) {
      await client.lTrim(MESSAGES_KEY, -MAX_MESSAGES, -1);
    }

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}