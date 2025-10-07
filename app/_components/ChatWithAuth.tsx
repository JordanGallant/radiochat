'use client';
import { useEffect, useState } from 'react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';

interface Message {
  id: string;
  content: string;
  username: string;
  userId: string;
  createdAt: string;
}

export default function ChatWithAuth() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load messages on mount and poll for updates
  useEffect(() => {
    if (!isSignedIn) return;

    loadMessages();
    
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);

    return () => clearInterval(interval);
  }, [isSignedIn]);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          username: user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'Anonymous',
          userId: user.id,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(); // Reload messages immediately
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="max-w-sm mx-auto mt-10 text-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  // Not signed in - show sign in button
  if (!isSignedIn) {
    return (
      <div className="max-w-sm mx-auto mt-10 text-center">
        <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900">
          <h2 className="text-2xl font-bold text-white mb-4">🎧 Live Radio Chat</h2>
          <p className="text-gray-400 mb-6">Sign in to join the conversation</p>
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Signed in - show chat
  return (
    <div className="max-w-md mx-auto mt-10 border border-gray-700 rounded-2xl p-4 bg-gray-900 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🎧 Live Radio Chat</h2>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="h-64 overflow-y-auto border border-gray-800 rounded-lg p-3 bg-gray-950">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">No messages yet. Be the first to chat!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="mb-2">
              <span className="font-semibold text-blue-400">{msg.username}: </span>
              <span>{msg.content}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}