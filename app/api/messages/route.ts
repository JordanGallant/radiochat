import { NextResponse } from 'next/server';

interface Message {
  id: string;
  content: string;
  username: string;
  createdAt: string;
}

// In-memory storage (will reset when server restarts)
let messages: Message[] = [];

export async function GET() {
  return NextResponse.json(messages);
}

export async function POST(request: Request) {
  try {
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

    messages.push(newMessage);

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages = messages.slice(-100);
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