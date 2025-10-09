'use client';
import { useEffect, useState } from 'react';

interface Message {
  id: string;
  content: string;
  username: string;
  createdAt: string;
}

export default function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSetUsername, setHasSetUsername] = useState(false);

  // Load messages on mount and poll for updates
  useEffect(() => {
    if (!hasSetUsername) return;

    loadMessages();
    
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000);

    return () => clearInterval(interval);
  }, [hasSetUsername]);

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
    if (!newMessage.trim() || !username || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          username: username,
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

  const handleSetUsername = () => {
    if (username.trim()) {
      setHasSetUsername(true);
    }
  };

  // Username setup screen
  if (!hasSetUsername) {
    return (
      <div className="max-w-sm mx-auto mt-10 text-center">
        <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900">
          <h2 className="text-2xl font-bold text-white mb-4">🎧 Live Radio Chat</h2>
          <p className="text-gray-400 mb-6">Enter your username to join</p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
            placeholder="Your username..."
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 mb-4"
          />
          <button
            onClick={handleSetUsername}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            disabled={!username.trim()}
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  // Chat screen - Full height
  return (
    <div className="h-screen flex flex-col max-w-md mx-auto border-x border-gray-700 bg-transparent text-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">🎧 Live Radio Chat</h2>
        <button
          onClick={() => setHasSetUsername(false)}
          className="text-sm text-gray-400 hover:text-white"
        >
          Change Username
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-950">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">No messages yet. Be the first to chat!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-blue-400">{msg.username}</span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className="text-gray-200">{msg.content}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 p-4 border-t border-gray-700 bg-gray-900">
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